{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
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
  on: (objId, name, data) ->
    objEl = @els[objId]
    objEl.addClass('highlight').delay(100).removeClass('highlight')
  # analogous to Document.createElement
  newEl: ({id,tag,cls,text,children}={}, setupCb) ->
    return @newLink(id:id) if @els[id]? if id?
    tag ?= 'div'
    el = $ document.createElement tag
    if id?
      @els[id] = el
      el.data 'id', id
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

@install = ->
  return if JObject::toDom?

  JObject::extend
    # $$ is the JView,context for DOM objects.
    domClass: 'object'
    makeDom: ($$) ->
      $$.newEl id:@id, tag:'div', cls:@domClass, (el) =>
        @addListener $$
        for key, value of @data
          el.append $$.newEl tag:'div', cls:'item', children:[
            $$.newEl tag:'label', cls:'keyword', text:key+':'
            value.makeDom($$)
          ]
    makeView: ->
      view = new JView
      view.root = @makeDom view
      return view

  JArray::extend
    domClass: 'array'

  JBoundFunc::extend
    domClass: 'boundfunc'

  clazz.extend Function,
    makeDom: ($$) ->
      $$.newEl tag:'span', cls:'function', text:'[Function]'

  clazz.extend String,
    makeDom: ($$) ->
      $$.newEl tag:'span', cls:'string', text:@

  clazz.extend Number,
    makeDom: ($$) ->
      $$.newEl tag:'span', cls:'number', text:@
