{clazz} = require 'cardamom'
assert = require 'assert'

tabSize = 2
tabCache = (Array(x+1).join(' ') for x in [0..tabSize])

Editor = @Editor = clazz 'Editor', ->
  init: ({@el, @mirror, @onSubmit, @mode}) ->
    assert.ok @el? or @mirror?, "Editor wants an @el or a premade @mirror"
    @mode ?= 'coffeescript'
    @el.append(@elInner=$('<div class="editor_inner"/>'))
    @mirror ?= @makeMirror(@elInner)

  makeMirror: (target) ->
    assert.ok target.length is 1, "Editor target el not unique"
    # target.append(ta=$('<textarea class="holdsTheValue"/>'))
    # Setup CodeMirror instance.
    # mirror = window._lastMirror = CodeMirror.fromTextArea ta[0],
    mirror = window._lastMirror = CodeMirror target[0],
      value:        '' # see mirror.setValue below.
      mode:         @mode
      theme:        'sembly'
      keyMap:       'sembly'
      autofocus:    yes
      gutter:       yes
      fixedGutter:  yes
      lineNumbers:  yes
      tabSize:      tabSize
      onChange: (->
        target.height($(mirror.getWrapperElement()).height())
      ).throttle(100)
    # Sanitization.
    mirror.sanitize = =>
      cursor = mirror.getCursor()
      tabReplaced = @replaceTabs orig=mirror.getValue()
      mirror.setValue tabReplaced
      mirror.setCursor cursor
      return tabReplaced
    # Gutter
    # mirror.setMarker 0, '● ', 'cm-bracket'
    # Events
    mirror.submit = @submit
    # Fix to set height of editor
    setTimeout (->mirror.setValue('')), 0
    return mirror

  # Utility method to replace all tabs with spaces
  replaceTabs: (str) ->
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

  submit$: ->
    value = @mirror.sanitize()
    return if value.trim().length is 0
    @onSubmit? value

  focus: ->
    @mirror.focus()
