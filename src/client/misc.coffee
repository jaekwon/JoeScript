{htmlEscape:hE, randid} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

jQuery.catch = (fn) ->
  wrapped = ->
    try
      fn.apply this, arguments
    catch err
      fatal "Uncaught error: #{err.stack ? err}"
      console.log "Uncaught error: #{err.stack ? err}"

# jquery extensions
jQuery.fn.extend(

  # https://github.com/padolsey/jQuery-Plugins/blob/master/sortElements/jquery.sortElements.js
  sortElements: (->
    sort = [].sort
    (comparator, getSortable) ->
      getSortable ||= -> @
      placements = @map ->
        sortElement = getSortable.call @
        parentNode = sortElement.parentNode
        nextSibling = parentNode.insertBefore(
          document.createTextNode(''),
          sortElement.nextSibling
        )
        return ->
          if this is parentNode
            throw new Error "You can't sort elements if any one is a descendant of another."
          parentNode.insertBefore @, nextSibling
          parentNode.removeChild nextSibling

      return sort.call(@, comparator).each (i) ->
        placements[i].call(getSortable.call(@))
  )()

  # scroll element down
  scrollDown: ->
    this.each ->
      elem = $(this)
      height = elem.prop('scrollHeight')
      elem.scrollTop(height)

  # value change event, triggers when the value actually changes upon user input
  valueChange: (options, callback) ->
    nonce = randid()
    dataattr = 'valueChange__last_value_'+nonce # to allow multiple binds to valueChange
    this.each ->
      elem = $(this)
      elem.data(dataattr, elem.val()) # remember the value
      elem.bind 'valueChange', (stuff...) ->
        callback.apply(this, stuff)
      elem.change (e) ->
        if elem.val() != elem.data(dataattr)
          elem.data(dataattr, elem.val())
          callback.apply(this, [e])
      if options.delay # TODO should we debounce?
        elem.delayedKeyup options.delay, (e) ->
          if elem.val() != elem.data(dataattr)
            elem.data(dataattr, elem.val())
            callback.apply(this, [e])
      else
        elem.keyup ((e) ->
          if elem.val() != elem.data(dataattr)
            elem.data(dataattr, elem.val())
            callback.apply(this, [e])).debounce(options.debounce ? 300)
    return this

  # delayed keyup for autosuggest etc
  delayedKeyup: (delay, callback) ->
    this.keyup (e) ->
      elem = $(this)
      window.clearTimeout(elem.data('input_timeout'))
      elem.data('input_timeout', window.setTimeout( ( =>
          callback.apply(this, [e])
          elem.removeData('input_timeout')
        ), delay)
      )
    return this

  # show a spinner
  spinner: (enable) ->
    $(this).find('>.spinner').remove()
    if enable
      $(this).append('<img src="/site_media/img/spinner.gif" title="loading..." class="spinner"/>')
    return this

  # set the hint on elements (basically a placeholder shim)
  hint: (manual_hint_text) ->
    this.each ->
      $input = $(this)
      origNameInfo = $input.data('idtHintOrigNameInfo')
      unless origNameInfo
        if $input.prop('name').length == 0
          origNameInfo = {swap: false, orig: ''}
        else
          origNameInfo = {swap: true, orig: $input.prop('name')}
        $input.data('idtHintOrigNameInfo', origNameInfo)
      old_hint = $input.data('hint')
      hint_text = manual_hint_text || $input.data('hint') || $input.prop('hint') || $input.attr('title')
      $input.data('hint', hint_text)
      on_focus = ->
        $input.removeClass 'hint'
        if origNameInfo.swap then $input.attr('name', origNameInfo.orig) # synchronous submits
        if $input.val() == hint_text
          $input.val ''
      on_blur = ->
        val = $input.val()
        if val == hint_text or val.trim().length == 0 or (val.length && val == old_hint)
          $input.val hint_text
          if origNameInfo.swap then $input.prop('name', '_hint_'+origNameInfo.orig) # synchronous submits
          $input.addClass 'hint'
      unless($input.is(':focus')) then on_blur()
      $input.unbind('.idtHint')
      $input.bind('focus.idtHint', on_focus)
      $input.bind('unhint.idtHint', on_focus) # HACK, to disable hint stuff
      $input.bind('blur.idtHint', on_blur)
    return this
  
  # makes a textarea autoresizable.
  make_autoresizable: (options) ->
    this.each (i, textarea) ->
      textarea = $(textarea)
      textarea.css(overflow:'hidden')
      # textarea.css(overflow: 'hidden')
      # we don't use a textarea because chrome has issues with undo's not working
      # when you interlace edits on multiple textareas.
      cloned_textarea = $(document.createElement('div')); #textarea.clone()
      cloned_textarea.attr
        cols: textarea.attr('cols')
        rows: textarea.attr('rows')
      cloned_textarea.css
        minHeight: textarea.css('min-height')
        minWidth: textarea.css('min-width')
        fontFamily: textarea.css('font-family')
        height: textarea.height
        lineHeight: textarea.css('line-height')
        fontSize: textarea.css('font-size')
        padding: textarea.css('padding')
        overflow: 'hidden' # the cloned textarea's scrollbar causes an extra newline at the end sometimes
        whiteSpace: 'pre-wrap'
        wordWrap: 'break-word'
      # hide it but don't actually hide it. 
      cloned_textarea.css position: 'absolute', left: '-1000000px', disabled: true
      $(document.body).prepend cloned_textarea
      autoresize_keyup = (event) ->
        cloned_textarea.css
          width: textarea.css('width')
        cloned_textarea.text('')
        textarea_val = textarea.val() + "---" # give the textbox some room to grow ahead
        for line in textarea_val.split("\n")
          cloned_textarea.append(hE(line))
          cloned_textarea.append('<br/>')
        textarea.css 'height', cloned_textarea[0].scrollHeight
        
      autoresize_enter = (event) ->
        # firefox has issues with ctrlKey-enter.
        # not sure what it is, but it eats up the event or something
        if event.keyCode == 13 and not \
            (options and options.submit_on_enter and not event.ctrlKey and not event.shiftKey)
          cloned_textarea.css
            width: textarea.css('width')
          cloned_textarea.text('')
          textarea_val = textarea.val() + "\n"
          for line in textarea_val.split("\n")
            cloned_textarea.append(hE(line))
            cloned_textarea.append('<br/>')
          textarea.css 'height', cloned_textarea[0].scrollHeight
      textarea.bind('keyup', autoresize_keyup)
      textarea.bind('keydown', autoresize_enter)
      # force autoresize right now
      setTimeout(autoresize_keyup, 0)
)

