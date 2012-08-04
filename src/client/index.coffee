require 'sugar'

# init. keep the DOM minimal so that this loads fast.
$(document).ready ->

  console.log "booting..."

  # Configure logging
  # Do before loading more libraries, as they may log stuff.
  {debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()
  domLog = window.domLog = $('#log')
  require('nogg').configure
    default:
      file:
        write: (line) ->
          domLog.append toHTML line
          $('#footer').scrollDown()
      level: 'debug'

  domLog.before('(<a id="log_toggle">log</a>)')
  $('#log_toggle').click -> domLog.show()
  domLog.hide()

  ###
  # UILayout
  $('body').layout
    defaults:
      applyDefaultStyles: no
    south:
      size:               500 # TODO
      applyDefaultStyles: yes
      initClosed:         yes
      onopen_end:         -> process.nextTick -> $('#main').scrollDown(); $('#footer').scrollDown()
  ###

  # load libraries
  {clazz} = require 'cardamom'
  {inspect} = require 'util'
  {randid} = require 'sembly/lib/helpers'
  {toHTML} = require 'sembly/src/parsers/ansi'
  {
    NODES:{JObject, JArray, JUndefined, JNull, JNaN, JBoundFunc, JStub}
    HELPERS:{isInteger,isObject}
    GLOBALS:{KERNEL, CACHE}
  } = require 'sembly/src/interpreter'
  JSL = require 'sembly/src/parsers/jsl'
  require 'sembly/src/client/dom' # DOM plugin
  require 'sembly/src/client/misc' # JQuery plugin, $.catch etc.
  {Editor} = require 'sembly/src/client/editor'

  # connect to server
  socket = io.connect()
  screen = undefined

  ## Send url to server.
  socket.emit 'load', window.location.pathname[1...]

  ## (re)initialize the screen.
  socket.on 'screen', $.catch (screenStr) ->
    console.log "received screen:", screenStr

    try
      screen = JSL.parse screenStr, env:{cache:CACHE}
    catch err
      fatal "Error in parsing screenStr '#{screenStr}':\n#{err.stack ? err}"
      return

    # Attach screen JView
    try
      window.screenView = screenView = screen.newView(socket)
      $('#screen').empty().append screenView.rootEl
    catch err
      fatal "Error in attaching screen view to DOM\n#{err.stack ? err}"

  ## Server diagnostic info
  socket.on 'server_info.', $.catch (data) ->
    for key, value of data.memory
      data.memory[key] = (Math.floor(value/10000)/100.0)+"Mb"
    $('#server_info').text(inspect data)

  process.nextTick -> socket.emit 'server_info?'
  $('#server_info_refresh').click -> socket.emit 'server_info?'; no
