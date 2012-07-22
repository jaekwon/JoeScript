sugar = require 'sugar'
http = require 'http'
connect = require 'connect'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()
{inspect} = require 'util'
assert = require 'assert'

# logging
require('nogg').configure
  'default': [
    {file: 'logs/app.log',    level: 'debug'},
    {file: 'stdout',          level: 'debug'}]
  #'foo': [
  #  {file: 'foo.log',    level: 'debug'},
  #  {forward: 'default'}]
  'access': [
    {file: 'logs/access.log', formatter: null}]

# uncaught exceptions
process.on 'uncaughtException', (err) ->
  warn """\n
^^^^^^^^^^^^^^^^^
http://debuggable.com/posts/node-js-dealing-with-uncaught-exceptions:4c933d54-1428-443c-928d-4e1ecbdd56cb
#{err.message}
#{err.stack}
vvvvvvvvvvvvvvvvv
"""

# server
c = connect()
  .use(connect.logger())
  #.use(connect.staticCache())
  .use('/s', connect.static(__dirname + '/static'))
  .use(connect.favicon())
  .use(connect.cookieParser('TODO determine just how secret this is'))
  .use(connect.session({ cookie: { maxAge: 1000*60*60*24*30 }}))
  .use(connect.query())
  .use(connect.bodyParser())
c.use (req, res) ->
  res.writeHead 200, {'Content-Type': 'text/html'}
  res.end """
<html>
<link rel='stylesheet' type='text/css' href='http://fonts.googleapis.com/css?family=Anonymous+Pro'/>
<link rel='stylesheet' type='text/css' href='/s/style.css'/>
<script src='/s/jquery-1.7.2.js'></script>
<script src='/s/boot.js'></script>
<body>
  hello<a href="/s/index.html" style="text-decoration: none; color:white; ">!</a>
</body>
</html>
"""

# server app
app = http.createServer(c)
io = require('socket.io').listen app
app.listen 8080


{NODES:joe} = require 'joeson/src/joescript'
{
  JKernel, JThread
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{CACHE, GOD, WORLD, ANON, KERNEL}
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'
require 'joeson/src/interpreter/perspective' # Perspective plugin

# KERNEL = new JKernel

# connect.io <-> kernel
io.sockets.on 'connection', (socket) ->

  # Setup default view and user-specific scope
  scope = WORLD.create ANON, {}
  Object.merge scope.data,
    output: output=(new JArray creator:ANON)
    clear:  new JBoundFunc creator:ANON, scope:scope, func:"""
              -> output.length = 0
            """
    print:  new JBoundFunc creator:ANON, scope:scope, func:"""
              (data) -> output.push data
            """

  # Ship 'output' over the wire.
  socket.emit 'output', output.__str__()

  # Link client and server via perspective on output.
  perspective = output.newPerspective(socket)

  # Input, as in I/O.
  socket.on 'input', (data) ->
    info "received input #{inspect data}"
    obj = CACHE[data.id]
    KERNEL.run
      user: ANON
      code: new joe.Assign target:(new joe.Index(obj:obj, key:'text')), value:data.text
      scope: scope
      callback: ->
        switch @state
          when 'return'
            #outputItem.__set__ @, 'result', @last
            info "return: #{@last.__str__(@)}"
          when 'error'
            @printErrorStack()
            # TODO push error to output
          else
            throw new Error "Unexpected state #{@state} during kernel callback"
        @cleanup()

  # Invoke a closure on the server.
  socket.on 'invoke', (data) ->
    info "received invokation #{inspect data}"
    boundFunc = CACHE[data.id]
    assert.ok boundFunc instanceof JBoundFunc, "Expected a JBoundFunc but got #{boundFunc} (#{boundFunc?.constructor?.name}) for ##{data.id}"

    invoke = ->
      KERNEL.run
        user: ANON
        code: 'bfunc()'
        scope: scope.create ANON, {bfunc:boundFunc}
        callback: ->
          switch @state
            when 'return'
              #outputItem.__set__ @, 'result', @last
              info "return: #{@last.__str__(@)}"
            when 'error'
              @printErrorStack()
              # TODO push error to output
            else
              throw new Error "Unexpected state #{@state} during kernel callback"
          @cleanup()

    if boundFunc.scope instanceof JStub
      # HACK, JStubs should have a URL for the appropriate persistence, when decentralized.
      WORLD.hack_persistence.loadJObject KERNEL, boundFunc.scope.id, (err, scope) ->
        boundFunc.scope = scope
        invoke()
    else
      invoke()

  # Run code
  socket.on 'run', (codeStr) ->
    info "received code #{codeStr}"

    # Create a new entry for output.
    outputItem = new JObject creator:ANON, data:{code:codeStr, result:'running...'}
    output.push undefined, [outputItem]

    # TODO make the 'code' property of output immutable.

    # Parse the codeStr and associate functions with the output Item
    try
      # info "received code:\n#{code}"
      node = require('joeson/src/joescript').parse codeStr
      # info "unparsed node:\n" + node.serialize()
      node = node.toJSNode(toValue:yes).installScope().determine()
      # info "parsed node:\n" + node.serialize()
    catch err
      # TODO better error message for syntax issues
      KERNEL.run user:ANON, code:'dontcare', callback: (_err) ->
        outputItem.__set__ @, 'result', JUndefined
        outputItem.__set__ @, 'error', "#{err.stack ? err}"
        @cleanup()
      return

    # Run the parsed code
    KERNEL.run
      user: ANON
      code: node
      scope: scope
      callback: ->
        switch @state
          when 'return'
            @state = @callback = null # reset thread state. TODO maybe run on another thread
            outputItem.__set__ @, 'result', @last
            info "return: #{@last.__str__(@)}"
            # view = @last.newView()
          when 'error'
            @state = @callback = null # reset thread state. TODO maybe run on another thread.
            @printErrorStack()
            outputItem.__set__ @, 'result', JUndefined
            outputItem.__set__ @, 'error', @errorStack()
          else
            throw new Error "Unexpected state #{@state} during kernel callback"
        @cleanup()

  # Server Diagnostics
  socket.on 'server_info?', -> socket.emit 'server_info.', memory:process.memoryUsage()
