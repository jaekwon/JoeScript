http = require 'http'
connect = require 'connect'

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

app = http.createServer(c)
io = require('socket.io').listen app
app.listen 1337

{JKernel, SYSTEM} = require 'joeson/src/interpreter'
kern = new JKernel
console.log "initialized kernel runloop"

io.sockets.on 'connection', (socket) ->
  socket.emit '_', {hello:'world'}
  socket.on 'code', ({code,ixid}) ->
    console.log "received code #{code}, ixid #{ixid}"
    kern.run
      user:   SYSTEM.user,
      code:   code,
      stdout: (str) ->
        console.log "stdout", str
        socket.emit 'stdout', str
      stderr: (str) ->
        console.log "stderr", str
        socket.emit 'stderr', str
      stdin:  undefined # not implemented
