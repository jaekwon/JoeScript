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

# analogous to an HTML Document
JView = @JView = clazz 'JView', ->
  init: ->
    @els = {}
    @root = undefined
    @id = "view#{randid()}"

  # a JView is also a listener, and this is
  # where it receives messages on objects.
  on: (obj, name, data) ->
    #debug "JView event: ##{obj.id} #{name}:#{inspect data}"
    objEl = @els[obj.id]
    debug "JView::on for event: #{name}"
    # delegate event to JObject subclass
    obj.dom_on @, objEl, name, data
    # flash it
    #objEl.addClass('highlight').delay(300).queue (next) ->
    #  $(this).removeClass 'highlight'
    #  next()

  # analogous to Document.createElement
  newEl: ({id,tag,cls,text,data,children}={}, setupCb) ->
    if id? and @els[id]?
      #debug "JView::newEl returning a link for ##{id}"
      return @newLink {id}
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
    el.addClass cls if cls?
    el.text text if text?
    el.append(child) for child in children if children?
    setupCb?(el)
    return el

  # creates a link element
  newLink: ({id,cls,text}={}) ->
    el = $ document.createElement 'span'
    el.text text ? "[link:##{id}]"
    el.addClass cls if cls?
    el.data 'ref', id
    return el

JObject::extend
  # $$ is the JView,context for DOM objects.
  domClass: 'object'
  newView: ->
    view = new JView
    view.root = @dom_draw view
    return view
  dom_draw: ($$) ->
    #debug "JObject::dom_draw for #{@}"
    items = {}
    $$.newEl id:@id, tag:'div', cls:@domClass, data:{items}, (el) =>
      @addListener $$
      for key, value of @data
        el.append items[key]=@dom_drawItem $$, key, value
  dom_drawItem: ($$, key, value) ->
    $$.newEl tag:'div', cls:'item', data:{key}, children:[
      $$.newEl tag:'span', cls:'attribute', text:key+':'
      value.dom_draw($$)
    ]
  dom_on: ($$, el, name, data) ->
    items = el.data('items')
    switch name
      when 'set', 'update'
        {key, value} = data
        itemEl = @dom_drawItem $$, key, value
        if existingEl=items[key]
          #debug "JObject::dom_on found existing item el for #{key}"
          existingEl.replaceWith itemEl
        else
          #debug "JObject::dom_on appending new item el for #{key}"
          el.append itemEl
        items[key] = itemEl

JArray::extend
  domClass: 'array'
  dom_on: ($$, el, name, data) ->
    items = el.data('items')
    switch name
      when 'set', 'push'
        {key, value} = data
        itemEl = @dom_drawItem $$, key, value
        if existingEl=items[key]
          #debug "JObject::dom_on found existing item el for #{key}"
          existingEl.replaceWith itemEl
        else
          #debug "JObject::dom_on appending new item el for #{key}"
          el.append itemEl
        items[key] = itemEl

JBoundFunc::extend
  domClass: 'boundfunc'
  dom_draw: ($$) ->
    $$.newLink id:@id, cls:'function', text:"[function:##{@id}]"

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
