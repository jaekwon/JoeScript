$('document').ready ->

  console.log "booting..."
  Telecode.connect()
  
  mirror = CodeMirror document.body,
    value:      ''
    mode:       'coffeescript'
    theme:      'joeson'
    autofocus:  yes
    keyMap:     'vim'
  mirror.submit = ->
    Telecode.pushCode @getValue()

  console.log "code mirror:", mirror

Telecode =
  connect: ->
    @socket = io.connect 'http://localhost:1337/'
    @socket.on 'stdout', (str) =>
      console.log "stdout: ", str
    @socket.on 'stderr', (str) =>
      console.log "stderr: ", str
    console.log "Telecode socket:", @socket

  pushCode: (code) ->
    @socket.emit 'code', code:code, ixid:undefined
