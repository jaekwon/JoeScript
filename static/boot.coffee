randid = (len=12) ->
  possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return (possible.charAt(Math.floor(Math.random() * possible.length)) for i in [0...len]).join ''

# replace all tabs with spaces
tabSize = 4
tabCache = (Array(x+1).join(' ') for x in [0..tabSize])
replaceTabs = (str) ->
  accum = []
  lines = str.split '\n'
  for line, i1 in lines
    parts = line.split('\t')
    col = 0
    for part, i2 in parts
      col += part.length
      accum.push part
      if i2 < parts.length-1
        insertWs = tabSize - col%tabSize
        col += insertWs
        accum.push tabCache[insertWs]
    if i1 < lines.length-1
      accum.push '\n'
  return accum.join ''

# init
$('document').ready ->

  console.log "booting..."
  Client.connect()

  console.log "marquee..." # don't worry it's just for elipses.
  marqueeLevel = 0
  setInterval (->
    m4Off = marqueeLevel%4
    $(".marq#{m4Off}m4").css opacity:1
    m4On = (++marqueeLevel)%4
    $(".marq#{m4On}m4").css  opacity:0.7
  ), 300

  # Setup CodeMirror instance which lives on the bottom of the page.
  mirror = CodeMirror document.body,
    value:      ''
    mode:       'coffeescript'
    theme:      'joeson'
    autofocus:  yes
    tabSize:    2
    keyMap:     'vim'

  # Before submitting, replace all tabs with spaces
  mirror.replaceTabs = ->
    mirror.setValue replaceTabs mirror.getValue()

  # Submitting...
  mirror.submit = ->
    return if @getValue().trim().length is 0
    # sanitize
    mirror.replaceTabs()
    cloned = $('.CodeMirror:last').clone(no)
    cloned.css(marginBottom:10)
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
      <span class="stdout"><span class='cm-bracket'>&gt;&gt;</span> <span id='#{ixid}'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></span></span>
    """)
    $('.CodeMirror:last').before(cloned)
    # scroll to bottom.
    window.scroll(0, document.body.offsetHeight)
    # push code to server
    Client.pushCode code:@getValue(), ixid:ixid
  console.log "code mirror:", mirror

  # When you click on the page, you focus.
  $(document).click ->
    mirror.focus()

writeTo = (ixid, html) ->
  span = $('#'+ixid)
  console.log ixid
  unless span.data('initialized')
    span.data('initialized', true)
    span.empty()
  if span.length > 0
    outputElement = $('<span/>').html(html)
    console.log "stdout:", outputElement
    span.append(outputElement)
    # scroll to bottom.
    window.scroll(0, document.body.offsetHeight)

Client =
  connect: ->
    @socket = io.connect()
    @socket.on 'stdout', (data) => writeTo data.ixid, data.html
    @socket.on 'stderr', (data) => writeTo data.ixid, data.html
    @socket.on '_', =>
      # Login to the system
      # TODO obviously this is buggy wrt asynchronicity. TODO fix.
      @login()
    console.log "Client socket:", @socket

  login: ->
    @socket.emit 'login', name:'joe', password:'dontcare'
    #@socket.on 'user', (user) => window.user = user

  pushCode: ({ixid, code}) ->
    @socket.emit 'code', code:code, ixid:ixid
