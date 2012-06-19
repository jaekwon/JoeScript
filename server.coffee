http = require 'http'
connect = require 'connect'
{debug, info, warn, error:fatal} = require('nogg').logger 'server'
assert = require 'assert'

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

process.on 'uncaughtException', (err) ->
  warn """\n
^^^^^^^^^^^^^^^^^
http://debuggable.com/posts/node-js-dealing-with-uncaught-exceptions:4c933d54-1428-443c-928d-4e1ecbdd56cb
#{err.message}
#{err.stack}
vvvvvvvvvvvvvvvvv
"""

app = http.createServer(c)
io = require('socket.io').listen app
app.listen 1337

{JKernel, SYSTEM} = require 'joeson/src/interpreter'
kern = new JKernel
info "initialized kernel runloop"

io.sockets.on 'connection', (socket) ->
  socket.emit '_', {hello:'world'}
  socket.on 'code', ({code,ixid}) ->
    info "received code #{code}, ixid #{ixid}"
    kern.run
      user:   SYSTEM.user,
      code:   code,
      stdout: (str) ->
        assert.ok typeof str is 'string', "stdout can only print strings"
        info "stdout", str, ixid
        socket.emit 'stdout', text:str, ixid:ixid
      stderr: (str) ->
        assert.ok typeof str is 'string', "stderr can only print strings"
        info "stderr", str, ixid
        socket.emit 'stderr', text:str, ixid:ixid
      stdin:  undefined # not implemented
