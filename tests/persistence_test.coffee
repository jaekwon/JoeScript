require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
{
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{GOD,ANON,KERNEL}
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'
console.log blue "\n-= persistence test =-"

{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

code = """
it = {foo:1, bar:2}
it.linkToIt = it
it.anArray = [1,2,3,4,"five"]
it
"""

try
  ok KERNEL.persistence?, "This test requires JPersistence installed on the global kernel"
  KERNEL.run
    user:ANON
    code:code
    callback: ->
      try
        if @error?
          console.log red "Error in running code:"
          @printErrorStack()
          process.exit(1)
          return
        obj = @last
        equal @state, 'return'
        ok not obj.listeners?, "No listeners expected for object unassociated with scope"
        # Emit event to persist obj
        obj.addListener KERNEL.persistence
        obj.emit thread:@, type:'new'
        equal @state, 'wait'

        # At this point the thread will become reanimated,
        # even though this is happening in the exit callback.
        # Since we don't want this callback to run again,
        # just replace the thread's callback function...
        @callback = ->
          equal @state, 'return'
          # Clear the kernel cache 
          KERNEL.cache = {}
          # Now try loading from persistence
          KERNEL.persistence.loadJObject KERNEL, obj.id, (err, _obj) ->
            if err?
              console.log red "Error loading object:"
              console.log red err.stack ? err
            console.log "Loaded object #{_obj.serialize()}"
            equal obj.id, _obj.id
            KERNEL.shutdown()
      catch err
        console.log red "Unknown Error:"
        console.log red err.stack ? err
        process.exit(1)
catch err
  console.log red "KERNEL ERROR:"
  console.log red err.stack ? err
  process.exit(1)
