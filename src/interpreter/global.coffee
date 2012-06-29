{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
joe = require('joeson/src/joescript').NODES
{pad, escape, starts, ends} = require 'joeson/lib/helpers'
{extend, isVariable} = require('joeson/src/joescript').HELPERS
{debug, info, warn, error:fatal} = require('nogg').logger 'server'

{JObject, JArray, JUser, JUndefined, JNull, JNaN} = require 'joeson/src/interpreter/object'

# A way to pretend that native functions have an id.
NATIVE_FUNCTIONS = {}
nativ = @nativ = (id, f) ->
  assert.ok id?, "NaFu wants an id"
  f.id = id
  NATIVE_FUNCTIONS[id] = f
  return f

GOD   = @GOD   = new JUser   id:'god',   name:'god'
GUEST = @GUEST = new JUser   id:'guest', name:'guest'
USERS = @USERS = new JArray  id:'users', creator:GOD
WORLD = @WORLD = new JObject id:'world', creator:GOD, data:
  users: USERS
  print: nativ 'print', ($, [obj]) ->
    $.output(obj.__html__($) + '<br/>')
    return JUndefined

redis = require 'redis'
client = redis.createClient()

# make sure objects in persistence store have everything here.
synchronize = (jobj, cb) ->
  console.log synchronize:jobj.id
  assert.ok jobj instanceof JObject, "Dunno how to save anything but a JObject type"
  assert.ok jobj.id, "JObject needs an id for it to be synchronized."
  jobj._saving = yes
  # save metainformation on id
  client.hmset jobj.id,
    type:jobj.constructor.name,
    creator:jobj.creator.id,
  , (err, res) ->
    keys = _.keys jobj.data
    async.forEach keys, (key, next) ->
      value = jobj.data[key]
      if value instanceof JObject
        return next() if value._saving # skip
        synchronize value, ->
          client.hset jobj.id, key, 'o:'+value.id, next
        return
      switch typeof value
        when 'string' then value = 's:'+value
        when 'number' then value = 'n:'+value
        when 'bool'   then value = 'b:'+value
        when 'function'
          assert.ok value.id?, "Tried to persist a native function with no id"
          value = 'f:'+value.id
        else throw new Error "dunno how to persist value #{value} (#{typeof value})"
      client.hset jobj.id, key, value, next
      return
    , (err) ->
      console.log "ERROR: "+err if err?

if require.main is module
  synchronize GOD
  synchronize GUEST
  synchronize WORLD
