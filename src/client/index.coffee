@require = require

# init. keep the DOM minimal so that this loads fast.
$(document).ready ->

  console.log "booting..."

  # configure logging
  {debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()
  domLog = window.domLog = $('#log')
  require('nogg').configure
    default:
      file:   {write:(line)->domLog.append(toHTML line)}
      level: 'debug'

  # load libraries
  {clazz} = require 'cardamom'
  {randid} = require 'joeson/lib/helpers'
  {toHTML} = require 'joeson/src/parsers/ansi'
  {
    JKernel, JThread
    NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
    GLOBALS:{GOD, WORLD, ANON}
    HELPERS:{isInteger,isObject,setLast}
  } = require 'joeson/src/interpreter'
  JSL = require 'joeson/src/parsers/jsl'
  require 'joeson/src/client/dom' # DOM plugin
  {Editor} = require 'joeson/src/client/editor'

  # TODO reconsider. some global object cache
  cache = {}

  # connect to server
  socket = window.socket = io.connect()

  # (re)initialize the output.
  socket.on 'output', (outputStr) ->
    console.log "received output"

    try
      output = JSL.parse cache, outputStr
    catch err
      error "Error in parsing outputStr '#{outputStr}':\n#{err.stack ? err}"
      return

    # Attach output JView
    $('#output').empty().append output.newView().rootEl

    # Attach listener for events
    socket.on 'event', (eventJSON) ->
      obj = cache[eventJSON.targetId]
      if not obj?
        fatal "Event for unknown object ##{eventJSON.targetId}."
        return
      for key, value of eventJSON
        unless key in ['type', 'key', 'targetId']
          try
            eventJSON[key] = JSL.parse cache, value
          catch err
            fatal "Error in parsing event item '#{key}':#{value} :\n#{err.stack ? err}"
            # XXX not sure what should go here.
      obj.emit eventJSON

    # Attach an editor now that output is available.
    unless window.editor?
      editor = window.editor = new Editor el:$('#input'), callback: (codeStr) ->
        console.log "sending code"
        socket.emit 'run', codeStr
