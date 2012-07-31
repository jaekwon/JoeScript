{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{randid, pad, htmlEscape, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{NODES:{JStub, JObject, JArray, JUndefined, JNull, JNaN, JBoundFunc}} = require 'sembly/src/interpreter/object'
{INSTR} = require 'sembly/src/interpreter/instructions'
#{JKernel, JThread, JStackItem} = require 'sembly/src/interpreter/kernel'

# A JObject listener
# Sends events to the client.
JPerspective = @JPerspective = clazz 'JPerspective', ->
  init: ({@socket, @root}) ->
    @id = "perspective:#{randid()}"
    @listenOn @root

  toString: -> "[JPerspective ##{@id} socket:#{@socket}]"

  # Receives messages from objects here.
  # obj: JObject that emitted event message
  # event: Event object, {thread,type,...}
  on: (obj, event) ->
    debug "JPerspective::on for event: #{event.type}"
    # Cache-set eventJSON for wire transfer
    unless event.eventJSON?
      # __str__ the values of the event object.
      eventJSON = {}
      for key, value of event
        # NOTE: mind the convention...
        continue if key is 'thread' # no need to be passing thread info
        if key in ['type', 'key', 'sourceId']
          eventJSON[key] = value
        else
          eventJSON[key] = INSTR.__str__ null, value # TODO null thread?
      event.eventJSON = eventJSON
    # Send event to client via socket.
    @socket.emit 'event', event.eventJSON
    # Delegate handling to JObject subclass
    obj.perspective_on @, event

  # Call to add a new object into the perspective.
  # Handles adding objects recursively.
  listenOn: (obj) ->
    debug "JPerspective::listenOn with obj: ##{obj.id}: #{INSTR.__str__ null, obj}"
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
      when 'set'
        {key, value} = event
        $$.listenOn value if value instanceof JObject
      when 'delete'
        # Would unlisten from the value but this is a GC situation.
        'TODO'
  # TODO consider refactoring out to JObject, since this is common already to persistence & perspective.
  perspective_getChildren: ->
    children = []
    if @data?
      children.push value for key, value of @data when value instanceof JObject
    children.push @proto if @proto instanceof JObject
    return children
