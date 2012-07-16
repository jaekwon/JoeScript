require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
{
  JThread, JKernel, GOD,
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:GLOBALS
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'
{JPersistence} = require 'joeson/src/interpreter/persistence'
console.log blue "\n-= persistence test =-"

{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

code = """
it = {foo:1, bar:2}
it.linkToIt = it
it
"""

kernel = new JKernel()
try
  kernel.run
    code:code
    callback: ->
      try
        if @error?
          console.log red "Error in running code:"
          @printErrorStack()
          process.exit(1)
          return
        equal @state, 'return'
        # Install persistence on @last.
        persistence = new JPersistence root:@last
        # Emit event to persist @last
        @last.emit thread:@, type:'new'
        equal @state, 'wait'
        # At this point the thread will become reanimated,
        # even though this is happening in the exit callback.
        # Since we don't want this callback to run again,
        # just replace the thread's callback function...
        @callback = ->
          equal @state, 'return'
          console.log 'ok'
          persistence.client.quit() # TODO
      catch err
        console.log red "Unknown Error:"
        console.log red err.stack ? err
        process.exit(1)
catch err
  console.log red "KERNEL ERROR:"
  console.log red err.stack ? err
  process.exit(1)
