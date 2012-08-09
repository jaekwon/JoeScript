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

  Concerns: currently, removed elements are detached so as to preserve data and events.
    If a removed element had a parent, the element is detached and swapped for a simple
    link to the element. This imposes a (probably good) limitation on how DOM elements,
    data, and events are related, by making things as isolated as possible.

###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JSingleton, JUndefined, JNull, JNaN, JBoundFunc, JStub}
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

    # Element already exists?
    if id? and (existingEl=@els[id])?
      link = @newLink {id}, (el) =>
        el.hover (e) =>
          @els[id].addClass('highlight')
        , (e) =>
          @els[id].removeClass('highlight')
      # Element still exists in the DOM
      if existingEl.closest('html').length > 0
        return link
      # Element is detached from the DOM
      else
        # Element has a parent
        if existingEl.parent().length > 0
          parent = existingEl.parent()
          existingEl.after link
          existingEl.detach()
          return existingEl
        return existingEl
      
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
    el.attr 'id', id
    el.attr attr if attr?
    el.addClass cls if cls?
    el.text text if text?
    el.append(child) for child in children if children?
    setupCb?(el)
    return el

  # creates a link element
  newLink: ({id,cls,text}={}, setupCb) ->
    el = $ document.createElement 'a'
    el.attr {href:"##{id}"}
    el.text text ? "[link:##{id}]"
    el.addClass cls if cls?
    el.data 'ref', id
    setupCb?(el)
    return el

JObject::extend
  domClass: 'object'
  newView: (socket) -> new JView root:@, socket:socket # Convenience

  # Handle an event for this object.
  # See documentation above.
  dom_on: ($V, el, event) ->
    # console.log el, "#{@}.dom_on #{event.type}"
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
          if existingEl=items[key]
            #debug "JObject::dom_on found existing item el for #{key}"
            # If existingEl's parent & key & value is the same, don't do anything.
            # TODO reconsider. too expensive?
            if existingEl.parent()[0] is el[0] and existingEl.data('key') is key and
              existingEl.data('value') is value
                'pass'
            else
              itemEl = @dom_drawItem $V, key, value
              existingEl.after itemEl
              existingEl.detach()
              items[key] = itemEl
          else
            #debug "JObject::dom_on appending new item el for #{key}"
            itemEl = @dom_drawItem $V, key, value
            el.append itemEl
            items[key] = itemEl
        when 'delete'
          {key} = event
          # TODO cannot just removeListener here.
          # value.removeListener $V
          if existingEl=items[key]
            existingEl.detach()
            delete items[key]
            # TODO re-attach to a link, if one exists. (tree grafting)
        else
          throw new Error "Unexpected event type #{event.type}"

  # Draw the element for the first time.
  dom_draw: ($V) -> # $V is JView
    switch @data.type
      when 'input'
        # draw an input field
        $V.newEl id:@id, tag:'input', data:@data, attr:{type:'text'}, (el) =>
          # HACK consider putting elsewhere.
          # When refactoring out, make sure addListener happens recursively.
          debug "Adding JView listener to ##{@id}"
          @addListener $V
          # HACK end
          el.val @data.text if @data.text?

      when 'editor'
        $V.newEl id:@id, tag:'div', cls:'editor', data:{}, (el) =>
          {Editor} = require 'sembly/src/client/editor'
          mode = @data.mode ? 'coffeescript'
          editor = new Editor mode:mode, el:el, onSubmit: (text) =>
            if @data.onSubmit?
              $V.socket.emit 'submit', data:text, onSubmit:@data.onSubmit.id
          process.nextTick ->
            # ipad hack
            # getting the touch keyboard to show up when tapping for the first time
            if navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)/i)
              $('#screen').append($('<input id="ipadhack" type="text"></input>'))
              $('#ipadhack').focus().hide()
            else
              editor.focus()
          # add submit button
          if @data.onSubmit?
            el.append submit=$('<button>submit</submit>')
            submit.click -> editor.submit(); no

      else # POJO
        #debug "JObject::dom_draw for #{@}"
        items = {}
        $V.newEl id:@id, tag:'div', cls:@domClass, data:{items}, (el) =>
          # HACK consider putting elsewhere.
          # When refactoring out, make sure addListener happens recursively.
          debug "Adding JView listener to ##{@id}"
          @addListener $V
          # HACK end
          if @data.__class__ # HACK
            el.addClass @data.__class__
          for key, value of @data when key not in ['__class__', 'onSubmit']
            el.append items[key]=@dom_drawItem $V, key, value
          # add submit button
          if @data.onSubmit?
            el.append submit=$('<button>submit</submit>')
            submit.click =>
              data = collectInput(el)
              $V.socket.emit 'submit', data:data, onSubmit:@data.onSubmit.id
              no

  # Draw key/value pairs for a POJO
  dom_drawItem: ($V, key, value) ->
    $V.newEl tag:'div', cls:'item', data:{key,value}, children:[
      $V.newEl tag:'span', cls:'key attribute', text:key+':'
      value.dom_draw($V)
    ]
  
JArray::extend
  domClass: 'object array'
  dom_on: ($V, el, event) ->
    switch event.type
      when 'set'
        if event.key is 'length'
          # hack to remove DOM items when array is truncated
          newLength = event.value
          items = el.data('items')
          for itemKey, itemEl of items
            if itemKey >= newLength
              itemEl.detach()
              delete items[itemKey]
          # no need to display the length
          return
        else
          @super.dom_on.call @, $V, el, event
          @dom_sortItems $V, el
          return
      when 'unshift'
        @dom_shiftKeys $V, el, 1
        {value} = event
        items = []
        for key, item of el.data('items')
          if isInteger(key)
            items[''+(Number(key)+1)] = item
          else
            items[key] = item
        items['0'] = itemEl = @dom_drawItem $V, '0', value
        el.data('items', items)
        el.prepend itemEl
        return
      when 'shift'
        shifted = (itemz=el.data('items'))['0']
        shifted.detach()
        delete itemz['0']
        @dom_shiftKeys $V, el, -1
        items = []
        for key, item of itemz
          if isInteger(key)
            items[''+(Number(key)-1)] = item unless Number(key) is 0
          else
            items[key] = item
        el.data('items', items)
        return
      else
        @super.dom_on.call @, $V, el, event
        #@dom_sortItems $V, el

  dom_shiftKeys: ($V, el, shift=-1) ->
    el.find('>.item').map ->
      item = $(@)
      if isInteger(key=item.data('key'))
        item.data('key', keyStr=(''+(Number(key)+shift)))
        item.find('>.key').text(keyStr+':')

  dom_sortItems: ($V, el) -> # sort ascending
    el.find('>.item').sortElements (a, b) ->
      key_a = $(a).data('key')
      key_b = $(b).data('key')
      if isInteger(key_a)
        if isInteger(key_b)
          if Number(key_a) > Number(key_b) then 1 else -1
        else
          return -1
      else
        if isInteger(key_b)
          return 1
        else
          if key_a > key_b then 1 else -1

JStub::extend
  domClass: 'stub'
  dom_draw: ($V) ->
    switch @type
      when 'F'
        $V.newLink id:@id, cls:'link', text:"[closure:##{@id}]", (el) =>
          el.click (e) =>
            $V.socket.emit 'invoke', {id:@id}
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
  newView: (socket) -> new JView root:@, socket:socket
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'singleton', text:@name

clazz.extend Function,
  newView: (socket) -> new JView root:@, socket:socket
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'function', text:'[Function]'

clazz.extend String,
  newView: (socket) -> new JView root:@, socket:socket
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'string', text:@

clazz.extend Number,
  newView: (socket) -> new JView root:@, socket:socket
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'number', text:@

clazz.extend Boolean,
  newView: (socket) -> new JView root:@, socket:socket
  dom_draw: ($V) ->
    $V.newEl tag:'span', cls:'boolean', text:@

# Find all input in el and get their values.
# Synchronously returns a data object.
collectInput = window.collectInput = (el) ->
  data = {}
  el.find('input[type=text],textarea.holdsTheValue').each(->
    # Find {type:'input'}.key, or construct one from the relative path.
    key = $(@).data('key')
    if not key?
      key = ''
      for item in $(@).parentsUntil(el, '.item')
        key = '.' + key if key
        key = $(item).data('key') + key
    data[key] = $(@).val()
  )
  return data
