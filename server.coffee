sugar = require 'sugar'
http = require 'http'
connect = require 'connect'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()
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
  hello
</body>
</html>
"""

# server app
app = http.createServer(c)
io = require('socket.io').listen app
app.listen 8080


{
  JKernel, JThread
  NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc, JStub}
  GLOBALS:{GOD, WORLD, ANON}
  HELPERS:{isInteger,isObject,setLast}
} = require 'joeson/src/interpreter'
require 'joeson/src/interpreter/perspective' # Perspective plugin

KERNEL = new JKernel

# connect.io <-> kernel
io.sockets.on 'connection', (socket) ->

  # Setup default view and user-specific scope
  scope = WORLD.create ANON, {}
  output = new JArray creator:ANON
  print = new JBoundFunc creator:ANON, scope:scope, func:"""
    (data) -> output.push data
  """
  Object.merge scope.data, {output, print}

  # Ship 'output' over the wire.
  socket.emit 'output', output.__str__()

  # Link client and server via perspective on output.
  perspective = output.newPerspective(socket)

  # start code
  socket.on 'run', (codeStr) ->
    info "received code #{codeStr}"

    # TODO append codeStr to output

    KERNEL.run
      user: ANON
      code: codeStr
      scope: scope
      callback: ->
        switch @state
          when 'return'
            output.push @, [new JObject creator:ANON, data:{result:@last}]
            info "return: #{@last.__str__(@)}"
            # view = @last.newView()
          when 'error'
            @printErrorStack()
            # TODO push error to output
          else
            throw new Error "Unexpected state #{@state} during kernel callback"
        @cleanup()
