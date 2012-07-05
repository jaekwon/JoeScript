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

newEl = ({tag,text}={}) ->
  tag ?= 'div'
  el = $ document.createElement tag
  el.text text if text?
  return el
newLink = ({text,id}={}) ->
  el = $ document.createElement 'span'
  el.text text ? "[link:##{id}]"
  el.data('ref', id)
  return el

@install = ->
  return if JObject::toDom?

  JObject::extend
    makeDom: ($$={}) ->
      assert.ok @id?, "JObject wants an id"
      return newLink() if $$[@id]?
      el = $$[@id] = newEl()
      for key, value of @data
        el.appendChild newEl tag:'label', text:key
        el.appendChild value.makeDom($$)
      return el

  JArray::extend
    makeDom: ($$={}) ->
      assert.ok @id?, "JArray wants an id"
      return newLink() if $$[@id]?
      el = $$[@id] = newEl()
      for key, value of @data
        el.appendChild newEl tag:'label', text:key
        el.appendChild value.makeDom($$)
      return el

  clazz.extend Function,
    makeDom: ($$={}) ->
      return newEl tag:'span', text:'[Function]'

  clazz.extend String,
    makeDom: ($$={}) ->
      return newEl tag:'span', text:@
