{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUser, JSingleton, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:GLOBALS
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'

# A JObject listener
JView = @JView = clazz 'JView', ->
  # root: the root JObject
  # rootEl: corresponding root DOM element
  # els: id -> element
  init: ({@root}) ->
    @els = {}
    @id = "view:#{randid()}"
    @rootEl = @root.dom_draw @

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
    if id? and (existingEl=@els[id])?
      #debug "JView::newEl returning a link for ##{id}"
      link = @newLink {id}, (el) ->
        el.hover (e) ->
          existingEl.addClass('highlight')
        , (e) ->
          existingEl.removeClass('highlight')
      return link
    #debug "JView::newEl creating new el for ##{id}"
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
  # Convenience
  newView: -> new JView root:@
  dom_draw: ($$) -> # $$ is JView
    # HACK
    if @data.type is 'input'
      $$.newEl id:@id, tag:'textarea', attr:{rows:'6', style:'line-height:1; width: 100%; min-height:20px;'}, (el) =>
        # TODO consider putting elsewhere. HACK
        debug "Adding JView listener to ##{@id}"
        @addListener $$
        el.val @data.text if @data.text?
        el.make_autoresizable()
        el.click (e) -> no # consume event
        el.valueChange {debounce:300}, (e) =>
          # @data.text = el.val() # ??
          # HACK
          socket.emit 'input', {id:@id, text:el.val()}
          #console.log el.val()
    else
      #debug "JObject::dom_draw for #{@}"
      items = {}
      $$.newEl id:@id, tag:'div', cls:@domClass, data:{items}, (el) =>
        # TODO consider putting elsewhere. HACK
        debug "Adding JView listener to ##{@id}"
        @addListener $$
        el.append $$.newEl tag:'span', cls:'debug right', text:''+@id # debug
        for key, value of @data
          el.append items[key]=@dom_drawItem $$, key, value
  dom_drawItem: ($$, key, value) ->
    $$.newEl tag:'div', cls:'item', data:{key}, children:[
      $$.newEl tag:'span', cls:'key attribute', text:key+':'
      value.dom_draw($$)
    ]
  dom_on: ($$, el, event) ->
    # HACK
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
        when 'set', 'update'
          {key, value} = event
          itemEl = @dom_drawItem $$, key, value
          if existingEl=items[key]
            #debug "JObject::dom_on found existing item el for #{key}"
            existingEl.replaceWith itemEl
          else
            #debug "JObject::dom_on appending new item el for #{key}"
            el.append itemEl
          items[key] = itemEl
        else
          throw new Error "Unexpected event type #{event.type}"
  
JArray::extend
  domClass: 'object array'
  dom_on: ($$, el, event) ->
    items = el.data('items') # item els
    switch event.type
      when 'set', 'push'
        {key, value} = event
        # hack to remove DOM items when array is truncated
        if key is 'length'
          newLength = value
          for itemKey, itemEl of items
            if itemKey >= newLength
              itemEl.remove()
              delete items[itemKey]
          # no need to display the length
          return
        itemEl = @dom_drawItem $$, key, value
        if existingEl=items[key]
          #debug "JObject::dom_on found existing item el for #{key}"
          existingEl.replaceWith itemEl
        else
          #debug "JObject::dom_on appending new item el for #{key}"
          el.append itemEl
        items[key] = itemEl
      else
        throw new Error "Unexpected event type #{event.type}"

JStub::extend
  domClass: 'stub'
  dom_draw: ($$) ->
    $$.newLink id:@id, cls:'link', text:"[link:##{@id}]", (el) =>
      console.log "STUB"
      el.hover (e) ->
        console.log "STUB HOVER"

JBoundFunc::extend
  domClass: 'boundfunc'
  dom_draw: ($$) ->
    $$.newLink id:@id, cls:'function', text:"[function:##{@id}]", (el) =>
      console.log "FUNC"
      el.hover (e) ->
        console.log "BFUNC HOBER"

JSingleton::extend
  dom_draw: ($$) ->
    $$.newEl tag:'span', cls:'singleton', text:@name

clazz.extend Function,
  dom_draw: ($$) ->
    $$.newEl tag:'span', cls:'function', text:'[Function]'

clazz.extend String,
  dom_draw: ($$) ->
    $$.newEl tag:'span', cls:'string', text:@

clazz.extend Number,
  dom_draw: ($$) ->
    $$.newEl tag:'span', cls:'number', text:@

clazz.extend Boolean,
  dom_draw: ($$) ->
    $$.newEl tag:'span', cls:'boolean', text:@
