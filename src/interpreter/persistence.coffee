{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
{pad, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, error:fatal} = require('nogg').logger 'server'

{JObject, JArray, JUser, JUndefined, JNull, JNaN} = require 'joeson/src/interpreter/object'

redis = require 'redis'
client = redis.createClient()

# make sure objects in persistence store have everything here.
saveJObject = @saveJObject = (jobj, cb) ->
  assert.ok jobj instanceof JObject, "Dunno how to save anything but a JObject type"
  assert.ok jobj.id, "JObject needs an id for it to be saved."
  jobj._saving = yes
  # save metainformation on id
  client.hmset jobj.id+':meta',
    type:jobj.constructor.name,
    creator:jobj.creator.id,
  , (err, res) ->
    keys = _.keys jobj.data
    # save each data item
    async.forEach keys, (key, next) ->
      value = jobj.data[key]
      saveJObjectItem jobj, key, value, next
    , (err) ->
      if err? then console.log "ERROR: "+err if err?
      else cb?()

saveJObjectItem = @saveJObjectItem = (jobj, key, value, cb) ->
  # save a JObj value
  if value instanceof JObject
    return cb() if value._saving # skip
    saveJObject value, ->
      client.hset jobj.id, key, 'o:'+value.id, cb
    return
  # save a native value
  switch typeof value
    when 'string' then value = 's:'+value
    when 'number' then value = 'n:'+value
    when 'bool'   then value = 'b:'+value
    when 'function'
      assert.ok value.id?, "Tried to persist a native function with no id"
      value = 'f:'+value.id
    else throw new Error "dunno how to persist value #{value} (#{typeof value})"
  client.hset jobj.id, key, value, cb

loadJObject = @loadJObject = (id, cb) ->
  assert.ok id, "loadJObject wants an id to load"
  client.hmgetall id+':meta', (err, meta) ->
    return cb(err) if err?
    obj = undefined
    XXX load user ...
    switch meta.type
      when 'JObject' then obj = new JObject creator:
      when 'JArray'
      else return cb("Unexpected type of object w/ id #{id}: #{meta.type}")
    
  # save metainformation on id
  client.hmset jobj.id+':meta',
    type:jobj.constructor.name,
    creator:jobj.creator.id,
  , (err, res) ->
    keys = _.keys jobj.data
    # save each data item
    async.forEach keys, (key, next) ->
      value = jobj.data[key]
      saveJObjectItem jobj, key, value, next
    , (err) ->
      if err? then console.log "ERROR: "+err if err?
      else cb?()

saveJObjectItem = @saveJObjectItem = (jobj, key, value, cb) ->
  # save a JObj value
  if value instanceof JObject
    return cb() if value._saving # skip
    saveJObject value, ->
      client.hset jobj.id, key, 'o:'+value.id, cb
    return
  # save a native value
  switch typeof value
    when 'string' then value = 's:'+value
    when 'number' then value = 'n:'+value
    when 'bool'   then value = 'b:'+value
    when 'function'
      assert.ok value.id?, "Tried to persist a native function with no id"
      value = 'f:'+value.id
    else throw new Error "dunno how to persist value #{value} (#{typeof value})"
  client.hset jobj.id, key, value, cb
