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

# Server
c = connect()
  .use(connect.logger())
  #.use(connect.staticCache())
  .use('/s', connect.static(__dirname + '/static'))
  .use(connect.favicon())
  .use(connect.cookieParser('TODO determine just how secret this is'))
  .use(connect.session({ cookie: { maxAge: 1000*60*60*24*30 }}))
  .use(connect.query())
  .use(connect.bodyParser())

# For all non /s/* requests (and /s/* that failed...)
c.use (req, res) ->
  # TODO cache file
  require('fs').readFile('static/index.html', (err, data) ->
    if err?
      res.writeHead 500, {'Content-Type': 'text/plain'}
      res.end "InternalError: #{err.stack ? err}"
      return
    res.writeHead 200, {'Content-Type': 'text/html'}
    res.end data
  )

# Connect to socket.io and start
app = http.createServer(c)
io = require('socket.io').listen app
app.listen argv.p ? 8080

# App dependencies
{NODES:joe} = require 'sembly/src/joescript'
{
  JKernel, JThread, INSTR
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{CACHE, GOD, WORLD, ANON, KERNEL}
  HELPERS:{isInteger,isObject,setLast}
} = require 'sembly/src/interpreter'
require 'sembly/src/interpreter/perspective' # Perspective plugin

# Helper to create a session transparently when there isn't one.
# Create session if necessary and ship screen over to client
# TODO garbage collection of perspectives.
withSession = (socket, fn) ->
  socket.get 'session', (err, session) ->
    if err?
      fatal "Error in socket.get 'session': #{err.stack ? err}"
      return
    if not session?
      # Setup default view and socket-specific session
      session = {}

      session.modules = modules = new JArray creator:ANON
      session.scope = scope = WORLD.create ANON, {modules}
      session.scope.data.clear = new JBoundFunc creator:ANON, scope:scope, func:"""
        -> modules.length = 0
      """
      # Construct a development screen
      session.screen = screen = new JArray creator:ANON, data:{__class__:'hideKeys'}
      session.perspective = screen.newPerspective(socket)

      # Save session
      socket.set 'session', session, ->
        fn(session)
      return

    fn(session)
    return

# Client <--> Server Connection
io.sockets.on 'connection', (socket) ->

  # Main connection entrypoint.
  # Loads a resource and creates a screen for the client.
  socket.on 'load', (path) -> withSession socket, (session) ->
    switch path
      when ''
        # It doesn't work if you manually add data after newPerspective.
        KERNEL.run user:ANON, code:'yes', scope:WORLD, callback: ->
          # Add modules and editor to screen
          INSTR.__set__ @, session.screen, 0, session.modules
          INSTR.__set__ @, session.screen, 1, new JObject creator:ANON, data:{type:'editor'}
          INSTR.__set__ @, session.screen, 'length', 2
          socket.emit 'screen', INSTR.__str__ @, session.screen
      else
        # Show the path on the screen.
        # NOTE keep user as ANON, arbitrary code execution happens here.
        KERNEL.run user:ANON, code:path, scope:WORLD, callback: ->
          INSTR.__set__ @, session.screen, 0, @last ? JUndefined
          INSTR.__set__ @, session.screen, 'length', 1
          socket.emit 'screen', INSTR.__str__ @, session.screen

  # Run code
  socket.on 'run', (codeStr) -> withSession socket, (session) ->
    info "Received code #{codeStr}"

    # Create a module to hold the code and results.
    # Module holds the code, output, result, error...
    # It doesn't hold the lexical scope, which should be throw-away and not persisted.
    _module = new JObject creator:ANON, data:{code:codeStr, status:'running'}
    # TODO make the 'code' property of output immutable.
    # Create the lexical scope.
    session.scope ?= WORLD.create ANON # HACK
    _moduleScope = session.scope.create ANON, {module:_module}
    _moduleScope.data.print = new JBoundFunc creator:ANON, scope:_moduleScope, func:"""
      (data) ->
        output = module.output
        if output is undefined
          output = []
          output.__class__ = 'hideKeys'
          module.output = output
        output.push data
        return
    """

    # Start a new thread. Note the 'yes' code. TODO refactor
    KERNEL.run user:ANON, code:'yes', scope:_moduleScope, callback: ->

      session.modules.push @, _module
      
      @enqueue callback: ->

        # Parse the codeStr and associate functions with the output Item
        try
          info "received code:\n#{codeStr}"
          node = require('sembly/src/joescript').parse codeStr
          # info "unparsed node:\n" + node.serialize()
          node = node.toJSNode(toValue:yes).installScope().determine()
          info "parsed node:\n" + node.serialize()
        catch err
          # TODO better error message for syntax issues
          @enqueue callback: ->
            INSTR.__del__ @, _module, 'status'
            # _module.__set__ @, 'result', JUndefined
            INSTR.__set__ @, _module, 'error', "#{err.stack ? err}"
            # @cleanup()
          return

        @enqueue code:node, callback: ->
          switch @state
            when 'return'
              INSTR.__del__ @, _module, 'status'
              INSTR.__set__ @, _module, 'result', @last
              info "return: #{INSTR.__str__ @, @last}"
              # view = @last.newView()
            when 'error'
              @printErrorStack()
              INSTR.__del__ @, _module, 'status'
              # _module.__set__ @, 'result', JUndefined
              INSTR.__set__ @, _module, 'error', @errorStack()
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
