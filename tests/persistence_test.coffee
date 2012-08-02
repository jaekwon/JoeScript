require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{GOD,ANON,WORLD,KERNEL}
  HELPERS:{isInteger,isObject,setLast}
} = require 'sembly/src/interpreter'
{JPersistence} = p = require 'sembly/src/interpreter/persistence'

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

require('async').series [

  (next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = {foo:1, bar:2}
      it.linkToIt = it
      it.anArray = [1,2,3,4,"five"]
      it.closure = -> it.foo + it.bar + it.anArray.length # 1 + 2 + 5 is 8
      it
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->
        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          it.closure()
          """, callback: _err_ ->
            equal @last, 8
            ps.client.quit()
            next()

  ,(next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = [1,2,3]
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->
        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          it.length
          """, callback: _err_ ->
            equal @last, 3
            ps.client.quit()
            next()

  ,(next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = [1,2,3]
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->
        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          it
          """, callback: _err_ ->
            deepEqual @last.jsValue(), [1,2,3]
            ps.client.quit()
            next()

  ,(next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = [1,2,3]
      it.pop()
      it
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->
        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          it
          """, callback: _err_ ->
            deepEqual @last.jsValue(), [1,2]
            ps.client.quit()
            next()

  ,(next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = [1,2,3]
      it.pop()
      it
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->
        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          foo = []
          foo.push it.pop()
          foo.push it
          foo
          """, callback: _err_ ->
            deepEqual @last.jsValue(), [2, [1]]
            ps.client.quit()
            next()

  ,(next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = [1,2,3]
      it.shift()
      it
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->
        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          foo = []
          it.unshift "QWE"
          foo.push it.shift()
          foo.push it
          foo
          """, callback: _err_ ->
            deepEqual @last.jsValue(), ["QWE", [2,3]]
            ps.client.quit()
            next()

  ,(next) -> # test
    ps = new JPersistence()
    KERNEL.run user:ANON, code: """
      it = messages:[]
      it
      """, callback: _err_ -> ps.saveJObject it=@last, _err_ ->

        KERNEL.cache = {} # reset cache
        KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
          it.messages.push "testing1"
          it.messages.push "testing2"
          """, callback: _err_ ->

            KERNEL.cache = {} # reset cache
            KERNEL.run user:ANON, scope: new JObject(creator:ANON, data:{it:it.stub(ps)}), code: """
              it.messages
              """, callback: _err_ ->
                deepEqual @last.jsValue(), ["testing1", "testing2"]
                ps.client.quit()
                next()

], (err, results) ->
  if err?
    fatal "ERROR: #{err.stack ? err}"
  else
    console.log "done!"
  KERNEL.shutdown()
