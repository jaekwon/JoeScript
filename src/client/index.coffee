@require = require

# init. keep the DOM minimal so that this loads fast.
$(document).ready ->

  console.log "booting..."

  # configure logging
  {debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()
  domLog = window.domLog = $('#log').css(display:'none')
  domLogVisible = no
  require('nogg').configure
    default:
      file:   {write:(line)->domLog.append(toHTML line)}
      level: 'debug'
  $('#panel').append $('<span>π</span>').addClass('debug right').click (e) ->
    if domLogVisible
      domLogVisible = no
      domLog.css(display:'none')
    else
      domLogVisible = yes
      domLog.css(display:'block')

  # load libraries
  {clazz} = require 'cardamom'
  {inspect} = require 'util'
  {randid} = require 'joeson/lib/helpers'
  {toHTML} = require 'joeson/src/parsers/ansi'
  {
    JKernel, JThread
    NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
    HELPERS:{isInteger,isObject}
  } = require 'joeson/src/interpreter'
  JSL = require 'joeson/src/parsers/jsl'
  require 'joeson/src/client/dom' # DOM plugin
  require 'joeson/src/client/misc' # DOM plugin
  {Editor} = require 'joeson/src/client/editor'

  # TODO reconsider.
  cache = window.cache = {} # Can't use CACHE because that'll overwrite client state.

  # connect to server
  socket = window.socket = io.connect()

  # catch uncaught errors
  _err_ = (fn) ->
    wrapped = ->
      try
        fn.apply this, arguments
      catch err
        fatal "Uncaught error in socket callback: #{err.stack ? err}"
        console.log "Uncaught error in socket callback: #{err.stack ? err}"

  ## (re)initialize the output.
  socket.on 'output', _err_ (outputStr) ->
    console.log "received output"

    try
      output = JSL.parse outputStr, env:{cache}
    catch err
      fatal "Error in parsing outputStr '#{outputStr}':\n#{err.stack ? err}"
      return

    # Attach output JView
    try
      window.outputView = output.newView()
      $('#output').empty().append outputView.rootEl
    catch err
      fatal "Error in attaching output view to DOM\n#{err.stack ? err}"

    # Attach listener for events
    socket.on 'event', _err_ (eventJSON) ->
      obj = cache[eventJSON.sourceId]
      info "new event #{inspect eventJSON} for obj ##{obj.id}"
      if not obj?
        fatal "Event for unknown object ##{eventJSON.sourceId}."
        return
      for key, value of eventJSON
        unless key in ['type', 'key', 'sourceId']
          try
            eventJSON[key] = valueObj = JSL.parse value, env:{cache} #, newCallback:(newObj) -> newObj.addListener outputView}
          catch err
            fatal "Error in parsing event item '#{key}':#{value} :\n#{err.stack ? err}"
            # XXX not sure what should go here.
      try
        obj.emit eventJSON
      catch err
        fatal "Error while emitting event to object ##{obj.id}:\n#{err.stack ? err}"

    # Attach an editor now that output is available.
    unless window.editor?
      editor = window.editor = new Editor el:$('#input'), callback: (codeStr) ->
        console.log "sending code"
        socket.emit 'run', codeStr

      $(document.body).click -> editor.focus()

  ## Server diagnostic info
  socket.on 'server_info.', _err_ (data) ->
    for key, value of data.memory
      data.memory[key] = (Math.floor(value/10000)/100.0)+"Mb"
    $('#server_info').text(inspect data)

  window.setInterval (-> socket.emit 'server_info?'), 1000
