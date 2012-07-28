###

  src/client/dom is responsible for handling events heard from the server.
  It's currently specific to DOM handling, but it'll probably mutate in the future
  towards a generic listening layer.

  The event gets emitted from the socket, gets dispatched by JView, which then tells
  the object to handle the event, given the DOM element and the event.

  <Server>::event ~>
    .. magic ..
      <Socket>::event -> # also <JView>.socket
        <JView>::on(obj, event) ->
          <JObject>::dom_on($V, el, event)

###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUser, JSingleton, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{CACHE,KERNEL}
  HELPERS:{isInteger,isObject}
} = require 'sembly/src/interpreter'
JSL = require 'sembly/src/parsers/jsl'

# A JObject listener
JView = @JView = clazz 'JView', ->
  # root: the root JObject
  # rootEl: corresponding root DOM element
  # els: id -> element
  # socket: socket.io connection to the server
  init: ({@root, @socket}) ->
    @els = {}
    @id = "view:#{randid()}"
    @rootEl = @root.dom_draw @

    # Main dispatcher for object events.
    # Attach listener for events
    @socket.on 'event', $.catch (eventJSON) ->
      # console.log "eventJSON", eventJSON
      obj = CACHE[eventJSON.sourceId]
      info "new event #{inspect eventJSON} for obj ##{obj.id}"
      if not obj?
        fatal "Event for unknown object ##{eventJSON.sourceId}."
        return

      for key, value of eventJSON
        unless key in ['type', 'key', 'sourceId']
          try
            eventJSON[key] = valueObj = JSL.parse value, env:{cache:CACHE} #, newCallback:(newObj) -> newObj.addListener screenView}
          catch err
            fatal "Error in parsing event item '#{key}':#{value} :\n#{err.stack ? err}"
            # XXX not sure what should go here.
      try
        obj.emit eventJSON
      catch err
        fatal "Error while emitting event to object ##{obj.id}:\n#{err.stack ? err}"

      # HACK to scroll down for screen.push
      $('#main').scrollDown() if obj is screen

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {type,...}
  on: (obj, event) ->
    objEl = @els[obj.id]
    debug "JView::on for event: #{event.type}"
    # Delegate handling to JObject subclass
    obj.dom_on @, objEl, event
    # flash it
    #objEl.addClass('highlight').delay(300).queue (next) ->
    #  $(this).removeClass 'highlight'
    #  next()

  # analogous to Document.createElement
  newEl: ({id,tag,cls,attr,text,data,children}={}, setupCb) ->
    if id? and @els[id]?
      debug "JView::newEl returning a link for ##{id}"
      link = @newLink {id}, (el) =>
        el.hover (e) =>
          @els[id].addClass('highlight')
        , (e) =>
          @els[id].removeClass('highlight')
      return link
    debug "JView::newEl creating new el for ##{id}"
    tag ?= 'div'
    el = $ document.createElement tag
    id ?= data.id if data?
    if id?
      @els[id] = el
      el.data 'id', id
    if data?
      delete data.id
      for key, value of data
        el.data key, value
    el.attr attr if attr?
    el.addClass cls if cls?
    el.text text if text?
    el.append(child) for child in children if children?
    setupCb?(el)
    return el

  # creates a link element
  newLink: ({id,cls,text}={}, setupCb) ->
    el = $ document.createElement 'a'
    el.attr {href:'#'}
    el.text text ? "[link:##{id}]"
    el.addClass cls if cls?
    el.data 'ref', id
    setupCb?(el)
    return el

JObject::extend
  domClass: 'object'
  newView: ($S) -> new JView root:@, socket:$S # Convenience

  # Handle an event for this object.
  # See documentation above.
  dom_on: ($V, el, event) ->
    # HACK. TODO. 'input' is deprecated.
    if @data.type is 'input'
      switch event.type
        when 'set'
          {key, value} = event
          assert.ok key is 'text', "Unexpected event 'set' for input with key: #{key}"
          #console.log event
          el.val(event.value).trigger('keyup')
        else
          throw new Error "Unexpected event type #{event.type} for input"
    else
      items = el.data('items')
      switch event.type
        when 'set'
          {key, value} = event
          itemEl = @dom_drawItem $V, key, value
          if existingEl=items[key]
            #debug "JObject::dom_on found existing item el for #{key}"
            existingEl.replaceWith itemEl
          else
            #debug "JObject::dom_on appending new item el for #{key}"
            el.append itemEl
          items[key] = itemEl
        when 'delete'
          {key} = event
          if existingEl=items[key]
            existingEl.remove()
            delete items[key]
            # TODO re-attach to a link, if one exists.
        else
          throw new Error "Unexpected event type #{event.type}"

  # Draw the element for the first time.
  dom_draw: ($V) -> # $V is JView
    switch @data.type
      when 'input'
        # DEPRECATED draw an input field
        $V.newEl id:@id, tag:'textarea', attr:{rows:'6', style:'line-height:1; width: 100%; min-height:20px;'}, (el) =>
          # TODO consider putting elsewhere. HACK
          debug "Adding JView listener to ##{@id}"
          @addListener $V
          el.val @data.text if @data.text?
          el.make_autoresizable()
          el.click (e) -> no # consume event
          el.valueChange {debounce:300}, (e) =>
            # @data.text = el.val() # ??
            # HACK
            @socket.emit 'input', {id:@id, text:el.val()}
            #console.log el.val()

      when 'editor'
        $V.newEl id:@id, tag:'div', cls:'editor', data:{items}, (el) =>
          {Editor} = require 'sembly/src/client/editor'
          editor = new Editor el:el, callback: (codeStr) =>
            console.log "sending code", codeStr
            @socket.emit 'run', codeStr
            # $('#main').scrollDown()

          ###
          # ipad hack, getting the touch keyboard to show up when tapping the page for the first time
          if navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)/i)
            $('#screen').append($('<input id="ipadhack" type="text"></input>'))
            $('#ipadhack').focus().hide()
          else
            editor.focus()
          # ipad hack end
          $('#input_editor').click -> editor.focus()
          $(document.body).click -> editor.focus(); no
          $('#input_submit').click (e) ->
            editor.submit()
            no
          ###

      else # POJO
        #debug "JObject::dom_draw for #{@}"
        items = {}
        $V.newEl id:@id, tag:'div', cls:@domClass, data:{items}, (el) =>
          # TODO consider putting elsewhere. HACK
          debug "Adding JView listener to ##{@id}"
          @addListener $V
          el.append $V.newEl tag:'span', cls:'debug right', text:''+@id # debug
          for key, value of @data
            el.append items[key]=@dom_drawItem $V, key, value

  # Draw key/value pairs for a POJO
  dom_drawItem: ($V, key, value) ->
    $V.newEl tag:'div', cls:'item', data:{key}, children:[
      $V.newEl tag:'span', cls:'key attribute', text:key+':'
      value.dom_draw($V)
    ]
  
JArray::extend
  domClass: 'object array'
  dom_on: ($V, el, event) ->
    if event.type is 'set' and event.key is 'length'
      # hack to remove DOM items when array is truncated
      newLength = value
      for itemKey, itemEl of items
        if itemKey >= newLength
          itemEl.remove()
          delete items[itemKey]
      # no need to display the length
      return
    @super.dom_on.call @, $V, el, event

JStub::extend
  domClass: 'stub'
  dom_draw: ($V) ->
    switch @type
      when 'F'
        $V.newLink id:@id, cls:'link', text:"[closure:##{@id}]", (el) =>
          el.click (e) =>
            @socket.emit 'invoke', {id:@id}
            no
      else
        $V.newLink id:@id, cls:'link', text:"[stub:##{@id}]", (el) =>
        
# Never rendered on the client yet, since the client never instantiates JBoundFunc objects.
JBoundFunc::extend
  domClass: 'boundfunc'
  dom_draw: ($V) ->
    $V.newLink id:@id, cls:'function', text:"[function:##{@id}]", (el) =>
      el.hover (e) ->
        console.log "JBoundFunc hover"

JSingleton::extend
  newView: ($S) -> new JView root:@, socket:$S
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'singleton', text:@name

clazz.extend Function,
  newView: ($S) -> new JView root:@, socket:$S
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'function', text:'[Function]'

clazz.extend String,
  newView: ($S) -> new JView root:@, socket:$S
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'string', text:@

clazz.extend Number,
  newView: ($S) -> new JView root:@, socket:$S
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'number', text:@

clazz.extend Boolean,
  newView: ($S) -> new JView root:@, socket:$S
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'boolean', text:@
