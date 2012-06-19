randid = (len=12) ->
  possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return (possible.charAt(Math.floor(Math.random() * possible.length)) for i in [0...len]).join ''

$('document').ready ->

  console.log "booting..."
  Telecode.connect()

  console.log "marquee..."
  marqueeLevel = 0
  setInterval (->
    m4Off = marqueeLevel%4
    $(".marq#{m4Off}m4").css opacity:1
    m4On = (++marqueeLevel)%4
    $(".marq#{m4On}m4").css  opacity:0.7
  ), 300
    
  
  mirror = CodeMirror document.body,
    value:      ''
    mode:       'coffeescript'
    theme:      'joeson'
    autofocus:  yes
    keyMap:     'vim'
  mirror.submit = ->
    cloned = $('.CodeMirror:last').clone(no)
    # remove some elements
    cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove()
    thing = cloned.find('.CodeMirror-lines>div:first>div:first')
    if thing.css('visibility') is 'hidden'
      thing.remove()
    else
      console.log "where'd that thing go?"
    # insert response box
    ixid = 'ixid'+randid()
    cloned.find('.CodeMirror-lines').append("""
      &gt;&gt; <span id='#{ixid}'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></span>
    """)
    $('.CodeMirror:last').before(cloned)
    Telecode.pushCode code:@getValue(), ixid:ixid
  console.log "code mirror:", mirror

writeTo = (ixid, text) ->
  span = $('#'+ixid)
  if span.length > 0
    textElement = $('<span/>').text(text)
    console.log textElement
    span.replaceWith(textElement)

Telecode =
  connect: ->
    @socket = io.connect 'http://localhost:1337/'
    @socket.on 'stdout', (data) => writeTo data.ixid, data.text
    @socket.on 'stderr', (data) => writeTo data.ixid, data.text
    console.log "Telecode socket:", @socket

  pushCode: ({ixid, code}) ->
    @socket.emit 'code', code:code, ixid:ixid
