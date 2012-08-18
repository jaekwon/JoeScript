require 'sugar'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{pad, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{JObject, JArray, JUndefined, JNull, JNaN, JStub, JBoundFunc} = require 'sembly/src/interpreter/object'

# Caches.
CACHE = @CACHE = {}
fnNamed = (name, fn) ->
  CACHE[name] = fn
  fn.id = name
  fn

if window?
  PERSISTENCE = undefined
else
  {JPersistence} = p = require 'sembly/src/interpreter/persistence'
  PERSISTENCE = new JPersistence()

GOD     = @GOD    = CACHE['god']    = new JObject id:'god',   creator:null, data:name:'God'
ANON    = @ANON   = CACHE['anon']   = new JObject id:'anon',  creator:GOD, data:name:'Anonymous'
USERS   = @USERS  = CACHE['users']  = new JObject id:'users', creator:GOD, data:
  god:    GOD
  anon:   ANON
OBJECT  = @OBJECT = CACHE['object'] = new JObject(id:'object', creator:GOD, proto:null, data:{
  toString: fnNamed('object_toString', ($, obj) -> obj.toString())
})
ARRAY   = @ARRAY  = CACHE['array']  = new JObject(id:'array', creator:GOD, data:{
  push: fnNamed('array_push', ($, arr, value) ->
    Array.prototype.push.call arr.data, value
    # actually, transaction below isn't necessary because set/length isn't necessary.
    # TODO BEGIN XACTION
    arr.emit {thread:$, type:'set', key:arr.data.length-1, value}
    # @emit {thread:$, type:'set', key:'length', value:@data.length}
    # TODO END XACTION
    return JUndefined
  )
  pop: fnNamed('array_pop', ($, arr) ->
    value = Array.prototype.pop.call arr.data
    arr.emit {thread:$, type:'set', key:'length', value:arr.data.length}
    return value ? JUndefined
  )
  shift: fnNamed('array_shift', ($, arr) -> # popping from the left
    value = Array.prototype.shift.call arr.data
    arr.emit {thread:$, type:'shift'}
    return value ? JUndefined
  )
  unshift: fnNamed('array_unshift', ($, arr, value) ->
    Array.prototype.unshift.call arr.data, value
    arr.emit {thread:$, type:'unshift', value}
    return arr.data.length ? JUndefined
  )
})

WORLD   = @WORLD = CACHE['world'] = new JObject id:'world', creator:GOD, data: {
  world:  new JStub(id:'world', persistence:PERSISTENCE)
  this:   USERS
  users:  USERS
  Object: OBJECT
  Array:  ARRAY

  login:  fnNamed('login', ($) ->
    return "TODO: This should be a form object with a callback."
  )

  eval:   fnNamed('eval', ($, this_, codeStr) ->
    # Parse the codeStr and associate functions with the output Item
    try
      info "evaluating code:\n#{codeStr}"
      node = require('sembly/src/joescript').parse codeStr
      info "unparsed node:\n" + node.serialize()
      node = node.toJSNode({}, toValue:yes).installScope().determine()
      info "parsed node:\n" + node.serialize()
    catch err
      return $.throw 'EvalError', "Error in eval(): #{err}"
    # Run node by pushing node into the stack.
    # NOTE: node should be a block, and it has its own scope,
    # so it's different from javascript's eval in this way.
    $.i9ns.push this:node, func:node.interpret
    return JUndefined
  )

  hasPrototype: new JBoundFunc(id:'hasPrototype', creator:GOD, scope:JNull, func:"""
    (obj, proto) ->
      obj = obj.__proto__ while obj? and obj != proto
      obj?
  """)

  serialize: fnNamed('serialize', ($, this_, codeStr, {maxDepth}={}) ->
    maxDepth ?= 4
    # ensure that maxDepth isn't greater than some limit,
    # otherwise the system will hang.
  )

  command: new JObject(id:'command', creator:GOD, data:{
    type: 'editor'
    mode: 'coffeescript'
    onSubmit: new JBoundFunc(id:'onSubmit', creator:GOD, scope:new JStub(id:'world'), func:"""
      ({modules, data:codeStr}) ->
        modules.push module={code:codeStr, status:'running'}
        print = (data) ->
          if not (output=module.output)?
            output = []
            output.__class__ = 'hideKeys'
            module.output = output # __class__ hack doesn't work with updates.
          output.push data
        try
          module.result = eval(codeStr)
        catch error
          module.error = error
        module!status
      """)
  })

  hydrate: new JBoundFunc(id:'hydrate', creator:GOD, scope:new JStub(id:'world'), func:"""
    (obj, seen={}) ->
      # print "hydrate \#{obj}"
      try
        return if seen[obj?id]
        seen[obj?id] = obj
      catch error
        #print "Error in step 1: \#{error}"
        return
      for key of obj
        try
          value = obj[key]
          if value?type is 'object'
            # print "hydrating \#{value?id}"
            hydrate(value, seen) unless seen[value?id]
        catch error
          #print "Error in step 2: \#{error}"
          return
      obj
    """)
}
WORLD.hack_persistence = PERSISTENCE # FIX

{JKernel} = require 'sembly/src/interpreter/kernel'
KERNEL = @KERNEL = new JKernel cache:CACHE
KERNEL.emitter.on 'shutdown', -> PERSISTENCE?.client.quit()

# Not all world items are initialized manually.
# Some (like command) live in the database, so
# if you need them, you want to call this method first.
# TODO refactor, make reload available to all objects.
WORLD.reload = (cb) ->
  delete CACHE['world']
  delete CACHE['users']
  PERSISTENCE.loadJObject 'world', CACHE, (err, world) ->
    WORLD.data = world.data if world?
    PERSISTENCE.loadJObject 'users', CACHE, (err, users) ->
      USERS.data = users.data if users?
      cb(err, world)

# run this file to set up redis
if require.main is module
  PERSISTENCE?.attachTo WORLD
  KERNEL.run({user:GOD, scope:WORLD, code: "yes", callback: (err) ->
    return console.log "FAIL!\n#{err.stack ? err}" if err?
    WORLD.emit thread:@, type:'new'
    @enqueue callback: (err) ->
      return console.log "FAIL!\n#{err.stack ? err}" if err?
      PERSISTENCE.client.quit() # TODO
      console.log "done!"
  })
