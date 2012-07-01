(function() {
  var GOD, GUEST, JKernel, KERNEL, WORLD, clazz, debug, domLog, fatal, info, randid, toHTML, warn, _ref, _ref2;

  this.require = require;

  clazz = require('cardamom').clazz;

  randid = require('joeson/lib/helpers').randid;

  toHTML = require('joeson/src/parsers/ansi').toHTML;

  _ref = require('nogg'), debug = _ref.debug, info = _ref.info, warn = _ref.warn, fatal = _ref.error;

  domLog = window.domLog = $('<pre/>');

  require('nogg').configure({
    "default": {
      file: {
        write: function(line) {
          return domLog.append(toHTML(line));
        }
      },
      level: 'debug'
    }
  });

  _ref2 = require('joeson/src/interpreter'), GOD = _ref2.GOD, WORLD = _ref2.WORLD, GUEST = _ref2.GUEST, JKernel = _ref2.JKernel;

  KERNEL = new JKernel;

  $(document).ready(function() {
    var marqueeLevel;
    $(document.body).append(domLog);
    console.log("booting...");
    marqueeLevel = 0;
    setInterval((function() {
      var m4Off, m4On;
      m4Off = marqueeLevel % 4;
      $(".marq" + m4Off + "m4").css({
        opacity: 1
      });
      m4On = (++marqueeLevel) % 4;
      return $(".marq" + m4On + "m4").css({
        opacity: 0.7
      });
    }), 300);
    return KERNEL.run({
      user: GUEST,
      code: 'login()',
      output: void 0,
      callback: function() {
        var stackTrace, _ref3, _ref4, _ref5, _ref6;
        switch (this.state) {
          case 'return':
            info(this.last.__str__(this));
            break;
          case 'error':
            if (this.error.stack.length) {
              this.printStack(this.error.stack);
              stackTrace = this.error.stack.map(function(x) {
                return '  at ' + x;
              }).join('\n');
              warn("" + ((_ref3 = this.error.name) != null ? _ref3 : 'UnknownError') + ": " + ((_ref4 = this.error.message) != null ? _ref4 : '') + "\n  Most recent call last:\n" + stackTrace);
            } else {
              warn("" + ((_ref5 = this.error.name) != null ? _ref5 : 'UnknownError') + ": " + ((_ref6 = this.error.message) != null ? _ref6 : ''));
            }
            break;
          default:
            throw new Error("Unexpected state " + this.state + " during kernel callback");
        }
        return this.cleanup();
      }
    });
  });

  /*
  
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
  */

}).call(this);
