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

unless JObject::toDom? then do =>

  Node::extend

  Block::extend
    interpret: ($) ->
      $.pop()
      # lucky us these can just be synchronous
      $.scope.__set__ $, variable, JUndefined for variable in @ownScope.nonparameterVariables if @ownScope?
      if (length=@lines.length) > 1
        $.push this:@, func:Block::interpretLoop, length:length, idx:0
      firstLine = @lines[0]
      $.push this:firstLine, func:firstLine.interpret
      return
    interpretLoop: ($, i9n, last) ->
      assert.ok typeof i9n.idx is 'number'
      if i9n.idx is i9n.length-2
        $.pop() # pop this
      nextLine = @lines[++i9n.idx]
      $.push this:nextLine, func:nextLine.interpret
      return

  clazz.extend Function, # native functions
    __get__:        ($) -> $.throw 'NotImplementedError', "Implement me"
