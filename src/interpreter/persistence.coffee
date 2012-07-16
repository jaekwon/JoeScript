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
# JPersistence saves objects onto redis
JPersistence = @JPersistence = clazz 'JPersistence', ->
  init: ({@client, @root}) ->
    @client ?= require('redis').createClient()
    @id = "persistence:#{randid()}"
    @listenOn @root

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {type,...}
  on: (obj, event) ->
    debug "#{@}::on for event: #{event.type}"
    # Delegate handling to JObject subclass
    obj.persistence_on @, event

  # Handles adding objects recursively.
  listenOn: (obj) ->
    debug "#{@}::listenOn with obj: ##{obj.id}: #{obj.__str__()}"
    if obj.addListener @
      # Recursively add children
      for child in obj.persistence_getChildren @
        assert.ok child instanceof JObject, "persistence_getChildren should have returned all JObject children"
        @listenOn child

  toString: -> "[JPersistence #{@id}]"

JObject::extend
  # Convenience
  persistence_on: ($$, event) ->
    switch event.type
      when 'new'
        @persistence_save $$, event.thread
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

  ###
    Naively save an object's metadata, then save the child recursively (if not saving already),
    then the parent's association to the child, for all children.

    It sets a _saving lock, which prevents circularity hell naively, but
    it also guarantees that concurrent 'save' calls will inflict all kinds of
    pain, as it simply skips saving.

    This should only be used upon objects that get initialized by a single thread.
    Normally there is no need to save all the items, as they get persisted on 'set' events.
  ###
  persistence_save: ($$, thread, cb) ->
    assert.ok @id, "JObject needs an id for it to be saved."
    return cb() if @_saving # nothing to do if already saving
    @_saving = yes
    thread.wait waitKey="persist:#{@id}"

    debug "$$.client.hmset #{@id+':meta'}"
    $$.client.hmset @id+':meta',
      type:@constructor.name,
      creator:@creator.id
    , (err, res) =>
      dataKeys = Object.keys @data
      # Asynchronously persist each key-value pair
      async.forEach dataKeys, (key, next) =>
        value = @data[key]
        debug "persistence_save saving key/value #{key}:#{value}"
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
            # Special case, recursively persist children. Depth first, apparently.
            value.persistence_save $$, thread, (err) =>
              return next(err) if err?
              debug "$$.client.hset #{@id}, #{key}, o:#{value.id}"
              $$.client.hset @id, key, 'o:'+value.id, next
            return
          else throw new Error "dunno how to persist value #{value} (#{typeof value})"
        # Set key-value(ref) pair to redis
        debug "$$.client.hset #{@id}, #{key}, #{value}"
        $$.client.hset @id, key, value, next
        return
      # After saving all key-value pairs (or upon error)
      , (err) =>
        delete @_saving
        if err?
          return cb(err) if cb?
          fatal "ERROR: #{err.stack ? err}"
          return thread.throw 'PersistenceError', "Failed to persist object ##{@id}"
        debug "thread.resume #{waitKey}"
        thread.resume waitKey
        return cb?()

JArray::extend
  persistence_on: ($$, event) ->
    switch event.type
      when 'set', 'push'
        {key, value} = event
        $$.listenOn value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine

# XXX refactor
# Lookup for native functions
NATIVE_FUNCTIONS = {}
nativ = @nativ = (id, f) ->
  assert.ok id?, "nativ wants an id"
  f.id = id
  NATIVE_FUNCTIONS[id] = f
  return f
# XXX refactor
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

