require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{GOD,ANON,WORLD,KERNEL}
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'
{JPersistence} = p = require 'joeson/src/interpreter/persistence'

console.log blue "\n-= persistence test =-"

# convenience handler
_err_ = (fn) ->
  (err, args...) ->
    if err?
      if err instanceof Error
        fatal "Native error in callback: #{err.stack ? err}"
      else
        fatal "Error in callback: #{inspect err}"
      process.exit(1)
    fn.call this, args...

persistence = new JPersistence()
KERNEL.run
  user:ANON
  code: """
  it = {foo:1, bar:2}
  it.linkToIt = it
  it.anArray = [1,2,3,4,"five"]
  it.closure = -> it.foo + it.bar + it.anArray.length # 1 + 2 + 5 is 8
  it
  """
  callback: _err_ ->
    obj = @last
    equal @state, 'return'
    ok not obj.listeners?, "No listeners expected for object unassociated with scope"
    # Emit event to persist obj
    obj.addListener persistence
    obj.emit thread:@, type:'new'
    equal @state, 'wait'

    # At this point the thread will become reanimated,
    # even though this is happening in the exit callback.
    # Since we don't want this callback to run again,
    # just replace the thread's callback function...
    @callback = _err_ ->
      equal @state, 'return'
      # Clear the kernel cache 
      KERNEL.cache = {}
      # Get a new persistence. (this isn't strictly necessary)
      persistence.client.quit()
      persistence = new JPersistence()
      # Now try loading from persistence
      persistence.loadJObject KERNEL, obj.id, _err_ (_obj) ->
        console.log "Loaded object #{_obj.serialize()}"
        equal obj.id, _obj.id

        # Now try running some code
        KERNEL.run
          user:ANON
          code: """
          it.closure()
          """
          scope: new JObject creator:ANON, data:{it:(new JStub id:obj.id)}
          callback: _err_ ->
            equal @last, 8
            console.log "done!"
            KERNEL.shutdown()
            persistence.client.quit()
