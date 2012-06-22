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
app.listen 8080

{JKernel, GOD} = require 'joeson/src/interpreter'
kern = new JKernel
info "initialized kernel runloop"

io.sockets.on 'connection', (socket) ->
  socket.emit '_', {hello:'world'}

  # login
  socket.on 'login', ({name,password}) ->
    info "login of user w/ name #{name} with password #{password}"
    user = kern.login name:name, password:password
    socket.set 'user', user, -> # do nothing.
    
  # code
  socket.on 'code', ({code,ixid}) ->
    info "received code #{code}, ixid #{ixid}"
    socket.get 'user', (err, user) ->
      if err?
        console.log "wtf?", err
        return
      kern.run
        user: user,
        code: code,
        stdout: (html) ->
          assert.ok typeof html is 'string', "stdout can only print html strings"
          info "stdout", html, ixid
          socket.emit 'stdout', html:html, ixid:ixid
        stderr: (html) ->
          assert.ok typeof html is 'string', "stderr can only print html strings"
          info "stderr", html, ixid
          socket.emit 'stderr', html:html, ixid:ixid
        stdin:  undefined # not implemented
