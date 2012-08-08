log = no

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{randid, pad, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{NODES:{JStub, JObject, JArray, JUndefined, JSingleton, JNull, JNaN, JBoundFunc}
HELPERS:{isInteger, _typeof}} = require 'sembly/src/interpreter/object'

# A JObject listener
# JPersistence saves objects onto redis
JPersistence = @JPersistence = clazz 'JPersistence', ->
  init: ({@client, @root}={}) ->
    @client ?= require('redis').createClient()
    @id = "persistence:#{randid()}"
    @attachTo @root if @root?

  toString: -> "[JPersistence #{@id}]"

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {thread,type,...}
  on: (obj, event) ->
    debug "#{cyan @}.#{red 'on'} EVENT type:#{red event.type} key:#{red event.key} on #{obj}" if log
    thread = event.thread
    assert.ok thread?, "JPersistence::on wants event.thread"
    switch event.type
      when 'new'
        thread.wait waitKey="persist:#{obj.id}"
        JObject::persistence_save.call obj, @, (err) ->
          return thread.throw 'PersistenceError', "Failed to persist object ##{obj.id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
      when 'set'
        {key, value} = event
        if obj instanceof JArray
          if key is 'length'
            assert.ok isInteger(value), "Array length must be an integer"
            thread.wait waitKey="persist:#{obj.id}#length"
            @client.eval """
              local id, length = KEYS[1], tonumber(KEYS[2]);
              local id_meta = id .. ':meta';
              local keys = redis.call('hkeys', id);
              local offset = redis.call('hget', id_meta, 'offset');
              local numDeleted = 0;
              offset = offset or 0;
              local maxOffset = offset + length - 1;
              redis.call('hset', id_meta, 'length', length);
              for i = 1, #keys, 1 do
                local key = tonumber(keys[i]);
                if key ~= nil and key > maxOffset then
                  redis.call('hdel', id, key)
                  numDeleted = numDeleted + 1;
                end;
              end;
              return numDeleted;
            """, 2, obj.id, value, (err) =>
              return thread.throw 'PersistenceError', "Failed to set length for array ##{obj.id}\n#{err.stack ? err}" if err?
              return thread.resume waitKey
            return
          else if isInteger key and Number(key) >= 0
            thread.wait waitKey="persist:#{obj.id}[#{key}]"
            JPersistence::withSave.call @, obj, (err) =>
              return thread.throw 'PersistenceError', "Failed to set for array ##{obj.id}\n#{err.stack ? err}" if err?
              # XXX watch is missing up when pushing, which modifies :meta below.
              # @client.watch obj.id+':meta' # TODO verify that this works
              @client.hmget obj.id+':meta', 'offset', 'length', (err, results) =>
                return thread.throw 'PersistenceError', "Failed to set for array ##{obj.id}\n#{err.stack ? err}" if err?
                [offset, length] = results
                offset = Number(offset ? 0)
                length = Number(length ? 0)
                multi = @client.multi()
                multi.hset obj.id+':meta', 'length', key+1 if key >= length
                multi.hset obj.id, offset+key, JPersistence::valueRepr value
                multi.exec (err, results) =>
                  err ?= "No multi exec results ?!" unless results?
                  return thread.throw 'PersistenceError', "Failed to set for array ##{obj.id}\n#{err.stack ? err}" if err?
                  return thread.resume waitKey
            return
          else
            'pass'
        thread.wait waitKey="persist:#{obj.id}.#{key}"
        JObject::persistence_saveItem.call obj, @, key, value, (err) =>
          return thread.throw 'PersistenceError', "Failed to persist key #{key} for object ##{obj.id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
      when 'delete'
        {key} = event
        thread.wait waitKey="delete:#{obj.id}[#{key}]"
        JObject::persistence_deleteItem.call obj, @, key, (err) =>
          return thread.throw 'PersistenceError', "Failed to delete key #{key} for object ##{obj.id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
      when 'shift'
        thread.wait waitKey="persist:#{obj.id}#shift"
        @client.eval """
          local id = KEYS[1];
          local id_meta = id .. ':meta';
          local keys = redis.call('hkeys', id);
          local offset = tonumber(redis.call('hget', id_meta, 'offset') or 0) + 1;
          local length = tonumber(redis.call('hget', id_meta, 'length') or 0) - 1;
          redis.call('hset', id_meta, 'offset', offset);
          redis.call('hset', id_meta, 'length', length);
          local numDeleted = 0;
          offset = offset or 0;
          for i = 1, #keys, 1 do
            local key = tonumber(keys[i]);
            if key ~= nil and key < offset then
              redis.call('hdel', id, key)
              numDeleted = numDeleted + 1;
            end;
          end;
          return numDeleted;
        """, 1, obj.id, (err) =>
          return thread.throw 'PersistenceError', "Failed to shift for array ##{obj.id}\n#{err.stack ? err}" if err?
          return thread.resume waitKey
        return
      when 'unshift'
        {value} = event
        thread.wait waitKey="persist:#{obj.id}#unshift"
        JPersistence::withSave.call @, value, (err) =>
          return thread.throw 'PersistenceError', "Failed to unshift for array ##{obj.id}\n#{err.stack ? err}" if err?
          # TODO transaction is broken.
          # @client.watch obj.id+':meta' # TODO verify that this works
          @client.hget obj.id+':meta', 'offset', (err, offset) =>
            return thread.throw 'PersistenceError', "Failed to unshift for array ##{obj.id}\n#{err.stack ? err}" if err?
            offset = Number(offset ? 0)
            multi = @client.multi()
            multi.hincrby obj.id+':meta', 'offset', -1
            multi.hincrby obj.id+':meta', 'length', 1
            multi.hset obj.id, offset-1, JPersistence::valueRepr value
            multi.exec (err, results) =>
              err ?= "No multi exec results ?!" unless results?
              return thread.throw 'PersistenceError', "Failed to unshift for array ##{obj.id}\n#{err.stack ? err}" if err?
              return thread.resume waitKey
    return

  # Attach <JPersistance> to an object and return yes if obj was newly attached.
  # options:
  #   recursive:  if yes, attach recursively. default no.
  attachTo: (obj, options) ->
    debug "#{cyan @}::#{yellow 'attachTo'} with obj: ##{obj.id}: #{obj}. Listeners" if log
    if obj.addListener @
      return yes unless options?.recursive
      # Recursively add children
      for child in JPersistence::getChildren @
        assert.ok child instanceof JObject, "JPersistence::getChildren should have returned all JObject children"
        @attachTo child, options
      return yes
    return no

  # Convenience... calls cb after persisting a new object (if not yet attached), recursively.
  withSave: (value, cb) ->
    if value instanceof JObject and @attachTo value
      JObject::persistence_save.call value, @, cb
    else
      cb()

  # Convenience... manually persist a new object, recursively.
  # Useful for testing, but normally (as of yet) this doesn't get called
  # by userland code.
  #
  # Calling this is similar to...
  #   obj.addListener <JPersistence>
  #   obj.emit thread:@, type:'new'
  # except `saveJObject` doesn't require a thread context.
  saveJObject: (obj, cb) ->
    debug "#{cyan @}::#{yellow 'saveJObject'} ##{obj.id}" if log
    assert.ok obj instanceof JObject, "Cannot save #{obj}"
    attached = @attachTo obj
    assert.ok attached, "Cannot attach to #{obj}"
    JObject::persistence_save.call obj, @, cb

  # Load an object with the given id.
  # id:     Id of object to load.
  # cache:  Cache to load (and save) associations from (to).
  # cb:     (err, obj) -> ...
  loadJObject: (id, cache, cb) ->
    debug "#{cyan @}::#{yellow 'loadJObject'} ##{id} (#{cb?})" if log
    assert.ok id, "loadJObject wants an id to load"
    assert.ok cache?, "loadJObject wants cache"
    $P = @

    $P.client.hgetall id+':meta', (err, meta) ->
      return cb(err) if err?
      return cb(":meta was null for ##{id}") if not meta?

      creator = cache[meta.creator] ? new JStub {persistence:$P, id:meta.creator} if meta.creator?

      switch meta.type
        when 'JObject'    then cache[id] = obj = new JObject {id,creator}
        when 'JArray'     then cache[id] = obj = new JArray  {id,creator}
        when 'JBoundFunc' then cache[id] = obj = new JBoundFunc {id,creator,func:null,scope:JNull} # func/scope will get loaded below
        else return cb("Unexpected type of object w/ id #{id}: #{meta.type}")
      obj.addListener $P

      $P.client.hgetall id, (err, _data) ->
        return cb(err) if err?
        #return cb("data was null for ##{id}") if not _data?
        if meta.type is 'JArray'
          # return cb("Loadded JArray had no length?") unless _data.length?
          # data = new Array(data.length)
          data = []
          data.__proto__ = null # detach native Array::
          {offset, length} = meta
          offset = Number(offset ? 0) # TODO figure out a better way, too easy to forget.
          length = Number(length ? 0)
        else
          data = _data
          data.__proto__ = null # detach native Object::
        debug "copying items: #{inspect _data}" if log
        for key, value of _data
          t = value[0]
          value = value[2...]
          switch t
            when 's' then value = value
            when 'n' then value = Number(value)
            when 'b' then value = Boolean(value)
            when 'f' then value = cache[value] ? -> throw new Error "Invalid native function"
            when 'o' then value = cache[value] ? new JStub {persistence:$P, id:value}
            when 'z' then value = JSingleton[value]
          # TODO currently invalid values just become strings.
          #   Reconsider, this might mask bugs.
          if key is '__proto__' # special case
            obj.proto = value
          else if meta.type is 'JArray'
            if isInteger(key)
              # TODO assert nonnegative...
              data[Number(key)-offset] = value
            else
              data[key] = value
          else
            data[key] = value
        obj.data = data
        debug "loaded\n#{obj.serialize()}" if log
        cb(null, obj)

  getChildren: (obj) ->
    children = []
    if obj.data?
      children.push value for key, value of obj.data when value instanceof JObject
    children.push obj.proto if obj.proto instanceof JObject
    return children

  valueRepr: (value) ->
    switch _typeof value
      when 'string'     then return 's:'+value
      when 'number'     then return 'n:'+value
      when 'boolean'    then return 'b:'+value
      when 'function'
        assert.ok value.id?, "Cannot persist a native function with no id"
        return 'f:'+value.id
      when 'object','stub' then return 'o:'+value.id
      when 'null'       then return 'z:null'
      when 'undefined'  then return 'z:undefined'
      else throw new Error "Dunno how to persist value #{value} (_typeof #{_typeof value})"

JObject::extend
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
    debug "#{cyan @}::#{red 'persistence_save'}" if log
    assert.ok @id, "JObject needs an id for it to be saved."
    return cb() if @_saving # nothing to do if already saving
    @_saving = yes

    debug "#{cyan '$$.client'}.#{yellow 'hmset'} #{@id+':meta'}" if log
    $$.client.hmset @id+':meta',
      type:@constructor.name,
      creator:@creator.id
    , (err, res) =>
      dataKeys = Object.keys @data
      dataKeys.push '__proto__' if @proto? # special case
      # Asynchronously persist each key-value pair
      async.forEach dataKeys, (key, next) =>
        value = if key is '__proto__' then @proto else @data[key]
        JObject::persistence_saveItem.call @, $$, key, value, next
        return
      # After saving all key-value pairs (or upon error)
      , (err) =>
        delete @_saving
        return cb(err)

  persistence_saveItem: ($$, key, value, cb) ->
    debug "#{cyan @}::#{yellow 'persistence_saveItem'} saving key/value #{key}:#{value}" if log
    assert.ok @id, "JObject::persistence_saveItem wants @id"
    JPersistence::withSave.call $$, value, (err) =>
      return cb(err) if err?
      valueRepr = JPersistence::valueRepr value
      debug "#{cyan '$$.client'}.#{yellow 'hset'} #{@id}, #{key}, #{valueRepr}" if log
      $$.client.hset @id, key, valueRepr, cb

  persistence_deleteItem: ($$, key, cb) ->
    debug "#{cyan @}::#{yellow 'persistence_deleteItem'} deleting key #{key}" if log
    assert.ok @id, "JObject::persistence_deleteItem wants @id"
    $$.client.hdel @id, key, cb
