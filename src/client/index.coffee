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
  @socket = io.connect()
  # (re)initialize the output.
  @socket.on 'output', (outputStr) ->
    console.log "received output"
    try
      output = JSL.parse cache, outputStr
    catch err
      error "Error in parsing outputStr '#{outputStr}':\n#{err.stack ? err}"
      return
    # Attach output JView
    $('#output').empty().append output.newView().root

  ###
  # make kernel
  KERNEL = new JKernel
  # Setup default view and user-specific scope
  scope = WORLD.create ANON, {}
  output = new JArray creator:ANON
  print = new JBoundFunc creator:ANON, scope:scope, func:"""
    (data) -> output.push data
  """
  Object.merge scope.data, {output, print}
  # Attach output JView
  $('#output').append output.newView().root

  # Attach input JView +
  # Setup the editor to run code.
  editor = window.editor = new Editor el:$('#input'), callback: (codeStr) ->
    KERNEL.run
      user: ANON
      code: codeStr
      scope: scope
      callback: ->
        switch @state
          when 'return'
            output.push @, [new JObject creator:ANON, data:{result:@last}]
            info "return: #{@last.__str__(@)}"
            #view = @last.newView()
          when 'error'
            @printErrorStack()
          else
            throw new Error "Unexpected state #{@state} during kernel callback"
        @cleanup()
  ###
