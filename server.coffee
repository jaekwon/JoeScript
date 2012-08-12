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
#{err.stack ? err}
vvvvvvvvvvvvvvvvv
"""

# Server
c = connect()
  .use(connect.logger())
  #.use(connect.staticCache())
  .use('/s', connect.static(__dirname+'/static'))
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

# HACK: load db persisted stuff of WORLD
WORLD.reload -> console.log "World loaded"

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
      session.screen =  screen =  new JArray creator:ANON, data:{__class__:'hideKeys'}
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
    path or= '@index'
    switch path
      when '__boot__'
        # It doesn't work if you manually add data after newPerspective.
        KERNEL.run user:ANON, code:'yes', scope:WORLD, callback: ->
          # Add modules and editor to screen
          INSTR.__set__ @, session.screen, 0, session.modules
          INSTR.__set__ @, session.screen, 1, WORLD.data.command
          INSTR.__set__ @, session.screen, 'length', 2
          socket.emit 'screen', INSTR.__str__ @, session.screen
      else
        # Show the path on the screen.
        # NOTE keep user as ANON, arbitrary code execution happens here.
        KERNEL.run user:ANON, code:path, scope:WORLD, callback: ->
          INSTR.__set__ @, session.screen, 0, @last ? JUndefined
          INSTR.__set__ @, session.screen, 'length', 1
          socket.emit 'screen', INSTR.__str__ @, session.screen

  # Server Diagnostics
  socket.on 'server_info?', -> socket.emit 'server_info.', memory:process.memoryUsage()

  # Form submits
  socket.on 'submit', ({data, onSubmit}) -> withSession socket, (session) ->
    info "Received submit data:#{data}, onSubmit:#{onSubmit}"

    KERNEL.run user:ANON, code:'onSubmit(event)', scope:WORLD.create(ANON, {
      onSubmit: (new JStub(id:onSubmit, persistence:WORLD.hack_persistence))
      event:    (new JObject(creator:ANON, data:{
        modules:  session.modules
        screen:   session.screen
        data:     data.toJoe(creator:ANON)
      }))
    }), callback: ->
      switch @state
        when 'STATE_RETURN'
          info "return: #{INSTR.__str__ @, @last}"
        when 'STATE_ERROR'
          @printErrorStack()
        else
          throw new Error "Unexpected state #{@state} during kernel callback"
