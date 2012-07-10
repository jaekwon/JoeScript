{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{
  NODES:{JObject, JArray, JUser, JSingleton, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:GLOBALS
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'

# A JObject listener
JPerspective = @JPerspective = clazz 'JPerspective', ->
  init: ({@socket, @root}) ->
    @id = "perspective:#{randid()}"
    @objs = {}
    @addObj @root

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {type,...}
  on: (obj, event, shared) ->
    debug "JPerspective::on for event: #{event.type}"
    assert.ok not event.targetId?, "event.targetId is reserved"
    event.targetId = obj.id
    unless shared.eventJSON?
      debug "Serializing values of event to eventJSON"
      # __str__ the values of the event object.
      shared.eventJSON = eventJSON = {}
      for key, value of event
        # NOTE: mind the convention...
        if key in ['type', 'key', 'targetId']
          eventJSON[key] = value
        else
          eventJSON[key] = value.__str__()
    # Send event to client via socket.
    @socket.emit 'event', shared.eventJSON
    # Delegate handling to JObject subclass
    obj.perspective_on @, event, shared

  # Call to add a new object into the perspective.
  # Handles adding objects recursively.
  addObj: (obj) ->
    debug "JPerspective::addObj with obj: ##{obj.id}: #{obj.__str__()}"
    return if @objs[obj.id]? # already in.
    @objs[obj.id] = obj
    obj.addListener @
    # recursivey add children
    for child in obj.perspective_withChildren @
      assert.ok child instanceof JObject, "perspective_withChildren should have returned all JObject children"
      @addObj child

JObject::extend
  # Convenience
  newPerspective: (socket) -> new JPerspective root:@, socket:socket
  perspective_on: ($$, event) ->
    switch event.type
      when 'set', 'update'
        {key, value} = event
        $$.addObj value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine
  # hmm... should JObjects be src/node/Nodes?... probably not
  perspective_withChildren: ($$) ->
    children = []
    if @data?
      children.push value for key, value of @data when value instanceof JObject
    children.push @proto if @proto instanceof JObject
    return children

JArray::extend
  perspective_on: ($$, event) ->
    switch event.type
      when 'set', 'push'
        {key, value} = event
        $$.addObj value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine
