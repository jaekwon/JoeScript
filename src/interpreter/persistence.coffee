{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{randid, pad, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:GLOBALS
  HELPERS:HELPERS
} = require 'joeson/src/interpreter'

# A JObject listener
JPersistence = @JPersistence = clazz 'JPersistence', ->
  init: ({@client, @root}) ->
    @id = "persistence:#{randid()}"
    @listenOn @root

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {type,...}
  on: ($, obj, event) ->
    debug "JPersistence::on for event: #{event.type}"
    # Delegate handling to JObject subclass
    obj.persistence_on $, @, event

  # Handles adding objects recursively.
  listenOn: (obj) ->
    debug "JPerspective::listenOn with obj: ##{obj.id}: #{obj.__str__()}"
    if obj.addListener @
      # recursivey add children
      for child in obj.persistence_getChildren @
        assert.ok child instanceof JObject, "persistence_getChildren should have returned all JObject children"
        @listenOn child

  saveJObject$: (jobj) ->
    assert.ok jobj instanceof JObject, "Dunno how to save anything but a JObject type"
    assert.ok jobj.id, "JObject needs an id for it to be saved."
    jobj._saving = yes # skip lock

    @client.hmset jobj.id+':meta',
      type:jobj.constructor.name,
      creator:jobj.creator.id
    , (err, res) ->
      dataKeys = Object.keys jobj.data
      async.forEach dataKeys, (key, next) ->
        value = jobj.data[key]
        saveJObjectItem jobj, key, value, next
      , (err) ->
        delete jobj._saving # skip lock
        if err? then console.log "ERROR: "+err if err?
        else cb?()

  saveJObjectItem$: (jobj, key, value, cb) ->
    # save a JObj value
    if value instanceof JObject
      return cb() if value._saving # skip
      saveJObject value, ->
        getClient().hset jobj.id, key, 'o:'+value.id, cb
      return
    # save a native value
    switch typeof value
      when 'string' then value = 's:'+value
      when 'number' then value = 'n:'+value
      when 'bool'   then value = 'b:'+value
      when 'function'
        assert.ok value.id?, "Cannot persist a native function with no id"
        value = 'f:'+value.id
      when 'object'
        assert.ok value instanceof JObject, "Unexpected value of #{value?.constructor.name}"
        assert.ok value.id, "Cannot persist a JObject without id"
        value = 'o:'+value.id
      else throw new Error "dunno how to persist value #{value} (#{typeof value})"
    getClient().hset jobj.id, key, value, cb

JObject::extend
  # Convenience
  persistence_on: ($$, event) ->
    switch event.type
      when 'new'
        $$.saveJObject @
      when 'set', 'update'
        {key, value} = event
        $$.listenOn value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine

  # hmm... should JObjects be src/node/Nodes?... probably not
  # XXX refactor out?
  persistence_getChildren: ($$) ->
    children = []
    if @data?
      children.push value for key, value of @data when value instanceof JObject
    children.push @proto if @proto instanceof JObject
    return children

JArray::extend
  persistence_on: ($$, event) ->
    switch event.type
      when 'set', 'push'
        {key, value} = event
        $$.listenOn value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine







# lookup for native functions
NATIVE_FUNCTIONS = {}
nativ = @nativ = (id, f) ->
  assert.ok id?, "nativ wants an id"
  f.id = id
  NATIVE_FUNCTIONS[id] = f
  return f

OBJECTS = {} # id to object.
getOrStub = (id) ->
  if cached=OBJECTS[id]
    return cached
  else
    return new JStub {id}

OBJECTS[value.id] = value for key, value of GLOBALS when value instanceof JObject

# make sure objects in persistence store have everything here.
saveJObject = @saveJObject = (jobj, cb) ->
  assert.ok jobj instanceof JObject, "Dunno how to save anything but a JObject type"
  assert.ok jobj.id, "JObject needs an id for it to be saved."
  jobj._saving = yes # skip lock

  getClient().hmset jobj.id+':meta',
    type:jobj.constructor.name,
    creator:jobj.creator.id
  , (err, res) ->
    dataKeys = Object.keys jobj.data
    async.forEach dataKeys, (key, next) ->
      value = jobj.data[key]
      saveJObjectItem jobj, key, value, next
    , (err) ->
      delete jobj._saving # skip lock
      if err? then console.log "ERROR: "+err if err?
      else cb?()

saveJObjectItem = @saveJObjectItem = (jobj, key, value, cb) ->
  # save a JObj value
  if value instanceof JObject
    return cb() if value._saving # skip
    saveJObject value, ->
      getClient().hset jobj.id, key, 'o:'+value.id, cb
    return
  # save a native value
  switch typeof value
    when 'string' then value = 's:'+value
    when 'number' then value = 'n:'+value
    when 'bool'   then value = 'b:'+value
    when 'function'
      assert.ok value.id?, "Cannot persist a native function with no id"
      value = 'f:'+value.id
    when 'object'
      assert.ok value instanceof JObject, "Unexpected value of #{value?.constructor.name}"
      assert.ok value.id, "Cannot persist a JObject without id"
      value = 'o:'+value.id
    else throw new Error "dunno how to persist value #{value} (#{typeof value})"
  getClient().hset jobj.id, key, value, cb

loadJObject = @loadJObject = (id, cb) ->
  console.log "loading #{id}"
  assert.ok id, "loadJObject wants an id to load"
  return cb(null, cached) if cached=OBJECTS[id]

  getClient().hgetall id+':meta', (err, meta) ->
    return cb(err) if err?
    assert.ok meta.creator?, "user had no creator?"
    assert.ok meta.creator isnt id, "heresy!"

    loadJObject meta.creator, (err, creator) ->
      return cb(err) if err?
      switch meta.type
        when 'JObject' then obj = new JObject creator:creator
        when 'JArray'  then obj = new JArray  creator:creator
        when 'JUser'   then obj = new JUser   name:id
        else return cb("Unexpected type of object w/ id #{id}: #{meta.type}")

      getClient().hgetall id, (err, _data) ->
        if meta.type is 'JArray'
          return cb("Loadded JArray had no length?") unless _data.length?
          data = new Array(data.length)
        else
          data = _data
        for key, value of _data
          t = value[0]
          value = value[2...]
          switch t
            when 's' then value = value
            when 'n' then value = Number(value)
            when 'b' then value = Bool(value)
            when 'f' then value = NATIVE_FUNCTIONS[value] ? -> throw new Error "Invalid native function"
            when 'o' then value = getOrStub value
          data[key] = value
        obj.data = data
        cb(null, obj)

