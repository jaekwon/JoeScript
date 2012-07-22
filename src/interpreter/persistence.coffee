{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{randid, pad, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{NODES:{JStub, JObject, JArray, JUser, JUndefined, JSingleton, JNull, JNaN, JBoundFunc}} = require 'joeson/src/interpreter/object'
{JKernel, JThread, JStackItem} = require 'joeson/src/interpreter/kernel'

# A JObject listener
# JPersistence saves objects onto redis
JPersistence = @JPersistence = clazz 'JPersistence', ->
  init: ({@client, @root}={}) ->
    @client ?= require('redis').createClient()
    @id = "persistence:#{randid()}"
    @listenOn @root if @root?

  toString: -> "[JPersistence #{@id}]"

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {thread,type,...}
  on: (obj, event) ->
    debug "#{@}::on for obj:#{obj} event.type:#{event.type}"
    # Delegate handling to JObject subclass
    obj.persistence_on @, event

  # Handles adding objects recursively.
  # Returns yes if obj is newly being listened on.
  listenOn: (obj, options) ->
    debug "#{@}::listenOn with obj: ##{obj.id}: #{obj.__str__()}. Listeners"
    if obj.addListener @
      return yes unless options?.recursive
      # Recursively add children
      for child in obj.persistence_getChildren @
        assert.ok child instanceof JObject, "persistence_getChildren should have returned all JObject children"
        @listenOn child, options
      return yes
    return no

  # Load an object with the given id for the given kernel
  # cb: (err, obj) -> ...
  loadJObject: (kernel, id, cb) ->
    debug "JPersistence::loadJObject #{kernel}, #{id}, #{cb?} (cb?)"
    assert.ok kernel?.cache?,               "loadJObject wants kernel.cache"
    assert.ok kernel?.nativeFunctions?,     "loadJObject wants kernel.nativeFunctions"
    assert.ok id,                           "loadJObject wants an id to load"
    $P = @
    cache = kernel.cache
    nativ = kernel.nativeFunctions
    return cb(null, cached) if cached=cache[id]

    $P.client.hgetall id+':meta', (err, meta) ->
      return cb(err) if err?

      creator = cache[meta.creator] ? new JStub {persistence:$P, id:meta.creator} if meta.creator?

      switch meta.type
        when 'JObject'    then obj = kernel.cache[id] = new JObject {id,creator}
        when 'JArray'     then obj = kernel.cache[id] = new JArray  {id,creator}
        when 'JUser'      then obj = kernel.cache[id] = new JUser   {id,creator,name}
        when 'JBoundFunc' then obj = kernel.cache[id] = new JBoundFunc {id,creator,func:null,scope:null} # func/scope will get loaded below
        else return cb("Unexpected type of object w/ id #{id}: #{meta.type}")
      obj.addListener $P

      $P.client.hgetall id, (err, _data) ->
        if meta.type is 'JArray'
          return cb("Loadded JArray had no length?") unless _data.length?
          data = new Array(data.length)
        else
          data = _data
        debug "loadJObject now setting up items: #{inspect _data}"
        for key, value of _data
          t = value[0]
          value = value[2...]
          switch t
            when 's' then value = value
            when 'n' then value = Number(value)
            when 'b' then value = Bool(value)
            when 'f' then value = nativ[value] ? -> throw new Error "Invalid native function"
            when 'o' then value = cache[value] ? new JStub {persistence:$P, id:value}
            when 'z' then value = JSingleton[value]
          # TODO currently invalid values just become strings.
          #   Reconsider, this might mask bugs.
          if key is '__proto__' # special case
            obj.proto = value
          else
            data[key] = value
        obj.data = data
        debug "loadJObject obj is now #{obj.serialize()}"
        cb(null, obj)

JObject::extend

  # This is the event handler delegated by JPersistence.
  persistence_on: ($$, event) ->
    thread = event.thread
    assert.ok thread?, "JObject::persistence_on wants event.thread"
    switch event.type
      when 'new'
        thread.wait waitKey="persist:#{@id}"
        @persistence_save $$, (err) ->
          return thread.throw 'PersistenceError', "Failed to persist object ##{@id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
      when 'set', 'update'
        {key, value} = event
        thread.wait waitKey="persist:#{@id}[#{key}]"
        @persistence_saveItem $$, key, value, (err) =>
          return thread.throw 'PersistenceError', "Failed to persist key #{key} for object ##{@id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
      # when 'delete'
      #   garbage collection routine

  # hmm... should JObjects be src/node/Nodes?... probably not
  # XXX refactor out? This is already duped
  persistence_getChildren: ($$) ->
    children = []
    if @data?
      children.push value for key, value of @data when value instanceof JObject
    children.push @proto if @proto instanceof JObject
    return children

  ###
    Persist the object if object is dirty, recursively.

    Naively save an object's metadata, then save the child recursively (if not saving already),
    then the parent's association to the child, for all children.

    It sets a _saving lock, which prevents circularity hell naively, but
    it also guarantees that concurrent 'save' calls will inflict all kinds of
    pain, as it simply skips saving.

    Note that descendants that are dirty do not have dirty parents won't get saved,
    as there is no way to know how to reach them.
  ###
  persistence_save: ($$, cb) ->
    assert.ok @id, "JObject needs an id for it to be saved."
    return cb() if @_saving # nothing to do if already saving
    @_saving = yes

    debug "$$.client.hmset #{@id+':meta'}"
    $$.client.hmset @id+':meta',
      type:@constructor.name,
      creator:@creator.id
    , (err, res) =>
      dataKeys = Object.keys @data
      dataKeys.push '__proto__' if @proto? # special case
      # Asynchronously persist each key-value pair
      async.forEach dataKeys, (key, next) =>
        value = if key is '__proto__' then @proto else @data[key]
        @persistence_saveItem $$, key, value, next
        return
      # After saving all key-value pairs (or upon error)
      , (err) =>
        delete @_saving
        return cb(err)

  persistence_saveItem: ($$, key, value, cb) ->
    assert.ok @id, "JObject needs an id for it to be saved."
    debug "persistence_save saving key/value #{key}:#{value}"

    switch typeof value
      when 'string' then value = 's:'+value
      when 'number' then value = 'n:'+value
      when 'bool'   then value = 'b:'+value
      when 'function'
        assert.ok value.id?, "Cannot persist a native function with no id"
        value = 'f:'+value.id
      when 'object'
        if value instanceof JObject
          assert.ok value.id, "Cannot persist a JObject without id"
          if $$.listenOn value
            value.persistence_save $$, (err) =>
              return cb(err) if err?
              debug "$$.client.hset #{@id}, #{key}, o:#{value.id}"
              $$.client.hset @id, key, 'o:'+value.id, cb
          else
            debug "$$.client.hset #{@id}, #{key}, o:#{value.id}"
            $$.client.hset @id, key, 'o:'+value.id, cb
          return
        else if value instanceof JSingleton
          value = 'z:'+value.name
        else return cb("Unexpected value #{value} (#{value?.constructor.name})")
      else throw new Error "dunno how to persist value #{value} (#{typeof value})"
    # Set key-value(ref) pair to redis
    debug "$$.client.hset #{@id}, #{key}, #{value}"
    $$.client.hset @id, key, value, cb
    return

JArray::extend
  persistence_on: ($$, event) ->
    thread = event.thread
    switch event.type
      when 'set', 'push'
        {key, value} = event
        thread.wait waitKey="persist:#{@id}[#{key}]"
        @persistence_saveItem $$, key, value, (err) =>
          return thread.throw 'PersistenceError', "Failed to persist key #{key} for object ##{@id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
      # when 'delete'
      #   garbage collection routine

### XXX wrong
JStub::extend
  persistence_loadDeep: ($$, thread, cb) ->
    thread.wait waitKey="load:#{@id}"
    $$.loadJObject thread.kernel, @id, (err, obj) ->
      return thread.error 'InternalError', err if err?
      thread.last = obj
      return thread.resume waitKey
###
