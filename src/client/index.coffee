@require = require
{clazz} = require 'cardamom'
{randid} = require 'joeson/lib/helpers'
{toHTML} = require 'joeson/src/parsers/ansi'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

# configure logging
domLog = window.domLog = $('<pre/>')
require('nogg').configure
  default:
    file:   {write:(line)->domLog.append(toHTML line)}
    level: 'debug'

{GOD, WORLD, GUEST, JKernel} = require 'joeson/src/interpreter'

KERNEL = new JKernel

# install dom stuff
require('joeson/src/client/dom').install()

# init
$(document).ready ->

  $(document.body).append(domLog)

  console.log "booting..."
  marqueeLevel = 0
  setInterval (->
    m4Off = marqueeLevel%4
    $(".marq#{m4Off}m4").css opacity:1
    m4On = (++marqueeLevel)%4
    $(".marq#{m4On}m4").css  opacity:0.7
  ), 300

  KERNEL.run
    user: GUEST
    code: 'foo = [1,2,3,"qwe",{foo:"bar"}]; foo.circ = foo; foo'
    callback: ->
      switch @state
        when 'return'
          info @last.__str__(@)
          view = @last.makeView()
          $(document.body).append view.root
        when 'error'
          @printErrorStack()
        else
          throw new Error "Unexpected state #{@state} during kernel callback"
      @cleanup()

###

  # connect to client.
  #window.client = client = new Client()
  # click page to focus
  #$(document).click -> client.mirror.focus()


outBoxHtml = """
<div class='outbox'>
  <div class='outbox-gutter'>
    <div class='outbox-gutter-text'>→ </div>
  </div>
  <div class='outbox-lines'><span class='marq2m4'>.</span><span class='marq1m4 marq3m4'>.</span><span class='marq0m4'>.</span></div>
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

Client = clazz 'Client', ->
  init: ->
    @threads = {}
    @mirror = @makeMirror()
    # connect
    @socket = io.connect()
    @socket.on 'output', @onOutput
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
      cursor = mirror.getCursor()
      tabReplaced = replaceTabs orig=mirror.getValue()
      mirror.setValue tabReplaced
      mirror.setCursor cursor
      return tabReplaced
    # Gutter
    mirror.setMarker 0, '● ', 'cm-bracket'
    # Blah
    $(mirror.getWrapperElement()).addClass 'active'
    # Events
    mirror.submit = @onSave
    return mirror

  start: ({code}) ->
    threadId = randid()
    @makeOutputForThread(threadId)
    @socket.emit 'start', code:code, threadId:threadId

  onSave$: ->
    value = @mirror.sanitize()
    return if value.trim().length is 0
    # Clone the current mirror and prepare
    mirrorElement = $(@mirror.getWrapperElement())
    cloned = mirrorElement.clone no
    cloned.removeClass 'active'
    cloned.find('.CodeMirror-cursor, .CodeMirror-scrollbar, textarea').remove()
    thing = cloned.find('.CodeMirror-lines>div:first>div:first')
    if thing.css('visibility') is 'hidden'
      thing.remove()
    else
      console.log "where'd that thing go?"
    @append cloned
    @start code:value

  onOutput$: ({command, html, threadId}) ->
    {output} = @threads[threadId]
    switch command
      when 'close'
        @close output:output
      when undefined
        @write output:output, html:html
      else
        throw new Error "Unexpected command #{command}"

  write: ({html, output}) ->
    unless output.data('initialized')
      output.data('initialized', yes)
      output.empty()
    output.append $('<span/>').html(html)
    # hack
    window.scroll 0, document.body.offsetHeight

  close: ({output}) ->
    unless output.data('initialized')
      output.data('initialized', yes)
      output.empty()

  makeOutputForThread: (threadId) ->
    # Insert response box
    outputBox = $(outBoxHtml)
    @append outputBox
    @threads[threadId] = output:outputBox.find '.outbox-lines'
    # Scroll to bottom.
    window.scroll(0, document.body.offsetHeight)

  append: (elem) ->
    mirrorElement = $(@mirror.getWrapperElement())
    mirrorElement.before elem
###
