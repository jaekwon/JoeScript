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
newCircular = (text="[Circular]") ->
  el = $ document.createElement 'span'
  el.text text
  return el

XXX consider multiple elements (multiple "sheets") for each object,
with each element getting synced simutaneously according to changes.
perhaps upon view. The window should have an understanding of what is visible. right?
hmm.

unless JObject::toDom? then do =>

  JObject::extend
    makeDom: ($$={}) ->
      return newCircular() if @el?
      assert.ok @id?, "JObject wants an id"
      @el = newEl()
      for key, value of @data
        @el.appendChild newEl tag:'label', text:key
        @el.appendChild value.makeDom($$)
      return @el

  JArray::extend
    makeDom: ($$={}) ->
      return newCircular() if @el?
      assert.ok @id?, "JObject wants an id"
      @el = newEl()
      for key, value of @data
        @el.appendChild newEl tag:'label', text:key
        @el.appendChild value.makeDom($$)
      return @el

  clazz.extend Function,
    makeDom: ($$={}) ->
      @el = newEl()

  clazz.extend String,
    makeDom: ($$={}) ->
      return makeEl tag:'span', text:@
