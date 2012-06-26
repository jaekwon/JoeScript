randid = (len=12) ->
  possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return (possible.charAt(Math.floor(Math.random() * possible.length)) for i in [0...len]).join ''

outBox = """
<div class='outbox'>
  <div class='outbox-gutter'>
    <div class='outbox-gutter-text'>→ </div>
  </div>
  <div class='outbox-stdout'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></div>
</div>
"""

# replace all tabs with spaces
tabSize = 2
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
  marqueeLevel = 0
  setInterval (->
    m4Off = marqueeLevel%4
    $(".marq#{m4Off}m4").css opacity:1
    m4On = (++marqueeLevel)%4
    $(".marq#{m4On}m4").css  opacity:0.7
  ), 300

  # connect to client.
  window.client = client = new Client()
  # click page to focus
  $(document).click -> client.mirror.focus()

Client = clazz 'Client', ->
  init: ->
    @threads = {}
    @mirror = @makeMirror()
    @mirror.submit = @onSave
    # connect
    @socket = io.connect()
    @socket.on 'stdout', @onStdout
    @socket.on 'stderr', @onStderr
    console.log "Client socket:", @socket
    # run help()
    @start code:'help()'

  makeMirror: ->
    # Setup CodeMirror instance.
    mirror = CodeMirror document.body,
      value:      ''
      mode:       'coffeescript'
      theme:      'joeson'
      keyMap:     'vim'
      autofocus:  yes
      gutter:     yes
      fixedGutter:yes
      tabSize:    2
    # Sanitization.
    mirror.sanitize = ->
      tabReplaced = replaceTabs orig=mirror.getValue()
      mirror.setValue tabReplaced
      return tabReplaced
    # Gutter
    mirror.setMarker 0, '● ', 'cm-bracket'
    return mirror

  start: ({code}) ->
    threadId = randid()
    stdout = @makeStdout()
    @threads[threadId] = stdout:stdout
    @socket.emit 'start', code:code, thread:threadId

  onSave$: ->
    value = @mirror.sanitize()
    return if value.trim().length is 0
    # Clone the current mirror and prepare
    # TODO find a better way to do this
    mirrorElement = $(@mirror.getWrapperElement())
    cloned = mirrorElement.clone no
    cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove()
    thing = cloned.find('.CodeMirror-lines>div:first>div:first')
    if thing.css('visibility') is 'hidden'
      thing.remove()
    else
      console.log "where'd that thing go?"
    @append cloned
    @start code:value

  onStdout$: ({html, thread}) ->
    {stdout} = @threads[thread]
    @write html:html, out:stdout

  onStderr$: ({html, thread}) ->
    {stderr,stdout} = @threads[thread]
    stderr ?= stdout
    @write html:html, out:stderr

  write: ({html, out}) ->
    unless out.data('initialized')
      out.data('initialized', yes)
      out.empty()
    out.append $('<span/>').html(html)
    # hack
    window.scroll 0, document.body.offsetHeight

  makeStdout: ->
    # Insert response box
    stdoutBox = $(outBox)
    @append stdoutBox
    # Scroll to bottom.
    window.scroll(0, document.body.offsetHeight)
    # Return the inner span
    return stdoutBox.find '.outbox-stdout'

  append: (elem) ->
    mirrorElement = $(@mirror.getWrapperElement())
    mirrorElement.before elem
