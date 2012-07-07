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
    # delegate event to JObject subclass
    obj.dom_on @, objEl, name, data
    # flash it
    objEl.addClass('highlight').delay(300).queue (next) ->
      $(this).removeClass 'highlight'
      next()
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
    view.root = @newEl view
    return view
  newEl: ($$) ->
    #debug "JObject::newEl for #{@}"
    items = {}
    $$.newEl id:@id, tag:'div', cls:@domClass, data:{items}, (el) =>
      @addListener $$
      for key, value of @data
        el.append items[key]=@newItemEl $$, key, value
  newItemEl: ($$, key, value) ->
    $$.newEl tag:'div', cls:'item', data:{key}, children:[
      $$.newEl tag:'label', cls:'keyword', text:key+':'
      value.newEl($$)
    ]
  dom_on: ($$, el, name, data) ->
    items = el.data('items')
    switch name
      when 'set', 'update'
        {key, value} = data
        itemEl = @newItemEl $$, key, value
        if existingEl=items[key]
          #debug "JObject::dom_on found existing item el for #{key}"
          existingEl.replaceWith itemEl
        else
          #debug "JObject::dom_on appending new item el for #{key}"
          el.append itemEl
        items[key] = itemEl

JArray::extend
  domClass: 'array'

JBoundFunc::extend
  domClass: 'boundfunc'

JSingleton::extend
  newEl: ($$) ->
    $$.newEl tag:'span', cls:'singleton', text:@name

clazz.extend Function,
  newEl: ($$) ->
    $$.newEl tag:'span', cls:'function', text:'[Function]'

clazz.extend String,
  newEl: ($$) ->
    $$.newEl tag:'span', cls:'string', text:@

clazz.extend Number,
  newEl: ($$) ->
    $$.newEl tag:'span', cls:'number', text:@
