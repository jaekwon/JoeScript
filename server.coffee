sugar = require 'sugar'
http = require 'http'
connect = require 'connect'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()
{inspect} = require 'util'
assert = require 'assert'

# options
argv = require('optimist')
  .usage('Usage: $0 -p [port, default 8080]')
  .argv
console.log argv

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
app.listen argv.p ? 8080


{NODES:joe} = require 'joeson/src/joescript'
{
  JKernel, JThread
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{CACHE, GOD, WORLD, ANON, KERNEL}
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'
require 'joeson/src/interpreter/perspective' # Perspective plugin

# KERNEL = new JKernel

# Client <--> Server Connection
io.sockets.on 'connection', (socket) ->

  # Setup default view and user-specific session
  scope = WORLD.create ANON, {}
  Object.merge scope.data,
    screen: screen=(new JArray creator:ANON)
    clear:  new JBoundFunc creator:ANON, scope:JUndefined, func:"""
              -> output.length = 0
            """
    print:  new JBoundFunc creator:ANON, scope:JUndefined, func:"""
              (data) -> output.push data
            """

  # Ship 'screen' over the wire.
  socket.emit 'screen', screen.__str__()

  # Link client and server via perspective on screen.
  perspective = screen.newPerspective(socket)

  # Run code
  socket.on 'run', (codeStr) ->
    info "received code #{codeStr}"

    # Create a module to hold the code and results.
    # Module holds the code, output, result, error...
    # It doesn't hold the lexical scope, which should be throw-away and not persisted.
    _module = new JObject creator:ANON, data:{code:codeStr, status:'running'}
    # Output from code goes here.
    output = new JArray creator:ANON
    _module.data.output = output
    # TODO make the 'code' property of output immutable.
    # Create the scope
    _moduleScope = scope.create ANON, {module:_module, output:output}

    # Start a new thread. Note the 'yes' code. TODO refactor
    KERNEL.run user:ANON, code:'yes', scope:_moduleScope, callback: ->

      screen.push @, _module
      
      @enqueue callback: ->

        # Parse the codeStr and associate functions with the output Item
        try
          # info "received code:\n#{code}"
          node = require('joeson/src/joescript').parse codeStr
          # info "unparsed node:\n" + node.serialize()
          node = node.toJSNode(toValue:yes).installScope().determine()
          # info "parsed node:\n" + node.serialize()
        catch err
          # TODO better error message for syntax issues
          @enqueue callback: ->
            _module.__set__ @, 'status', 'error'
            # _module.__set__ @, 'result', JUndefined
            _module.__set__ @, 'error', "#{err.stack ? err}"
            # @cleanup()
          return

        @enqueue code:node, callback: ->
          switch @state
            when 'return'
              _module.__set__ @, 'status', 'complete'
              _module.__set__ @, 'result', @last
              info "return: #{@last.__str__(@)}"
              # view = @last.newView()
            when 'error'
              @printErrorStack()
              _module.__set__ @, 'status', 'error'
              # _module.__set__ @, 'result', JUndefined
              _module.__set__ @, 'error', @errorStack()
            else
              throw new Error "Unexpected state #{@state} during kernel callback"
          # @cleanup()

  # Server Diagnostics
  socket.on 'server_info?', -> socket.emit 'server_info.', memory:process.memoryUsage()

  ###
  # Input, as in I/O.
  # DEPRECATED
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
        # @cleanup()

  # Invoke a closure on the server.
  # DEPRECATED
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
          # @cleanup()

    if boundFunc.scope instanceof JStub
      # HACK, JStubs should have a URL for the appropriate persistence, when decentralized.
      WORLD.hack_persistence.loadJObject KERNEL, boundFunc.scope.id, (err, scope) ->
        boundFunc.scope = scope
        invoke()
    else
      invoke()
  ###
