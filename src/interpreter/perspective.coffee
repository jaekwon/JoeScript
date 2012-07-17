{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{NODES:{JStub, JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc}} = require 'joeson/src/interpreter/object'
#{JKernel, JThread, JStackItem} = require 'joeson/src/interpreter/kernel'

# A JObject listener
# Sends events to the client.
JPerspective = @JPerspective = clazz 'JPerspective', ->
  init: ({@socket, @root}) ->
    @id = "perspective:#{randid()}"
    @listenOn @root

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {thread,type,...}
  on: (obj, event) ->
    debug "JPerspective::on for event: #{event.type}"
    # Cache-set eventJSON for wire transfer
    unless event.eventJSON?
      debug "Serializing values of event to eventJSON"
      # __str__ the values of the event object.
      eventJSON = {}
      for key, value of event
        # NOTE: mind the convention...
        if key in ['type', 'key', 'sourceId']
          eventJSON[key] = value
        else if key is 'thread'
          'pass'
        else
          eventJSON[key] = value.__str__()
      event.eventJSON = eventJSON
    # Send event to client via socket.
    @socket.emit 'event', event.eventJSON
    # Delegate handling to JObject subclass
    obj.perspective_on @, event

  # Call to add a new object into the perspective.
  # Handles adding objects recursively.
  listenOn: (obj) ->
    debug "JPerspective::listenOn with obj: ##{obj.id}: #{obj.__str__()}"
    if obj.addListener @
      # recursivey add children
      for child in obj.perspective_getChildren()
        assert.ok child instanceof JObject, "perspective_getChildren should have returned all JObject children"
        @listenOn child

JObject::extend
  # Convenience
  newPerspective: (socket) -> new JPerspective root:@, socket:socket
  perspective_on: ($$, event) ->
    switch event.type
      when 'set', 'update'
        {key, value} = event
        $$.listenOn value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine
  # TODO consider refactoring out to JObject, since this is common already to persistence & perspective.
  perspective_getChildren: ->
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
        $$.listenOn value if value instanceof JObject
      # when 'delete'
      #   garbage collection routine
