###
JoeSon Parser
Jae Kwon 2012
###

_ = require 'underscore'
assert = require 'assert'
{inspect, CodeStream} = require './codestream'
{clazz} = require 'cardamom'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'

escape = (str) ->
  (''+str).replace(/\\/g, '\\\\').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/'/g, "\\'")

@Context = Context = clazz 'Context', ->
  init: (@code, @grammar, @stack=[], @cache={}, @result, @debug) ->
    # stack = [ {name, pos, snowball?:{value,endPos} }... ]
    # cache[context.code.pos][@rule.name] = {result,endPos}

  # A block of code, must set @result to nonnull
  # for @code.pos to change. 
  try: (fn) ->
    @result = null
    pos = @code.pos
    passthru = fn.call this
    @code.pos = pos if @result isnt null
    passthru

  log: (args...) ->
    if @debug
      console.log "#{cyan Array(@stack.length+1).join '|  '} #{args.join ''}"

###
In addition to the attributes defined by subclasses,
  the following attributes exist for all nodes.

node.rule = The topmost node of a rule.
node.rule = rule # sometimes true.
node.name = name of the rule, if this is @rule.

###
@Node = Node = clazz 'Node', ->

  @$cache = (fn) -> (context) ->
    if this isnt @rule then return context.result = fn.call this, context
    context.log "[C] rule #{@name}"
    cacheKey = @name
    if cacheKey? and (cached=context.cache[origPos=context.code.pos]?[cacheKey])?
      context.log "[C] Cache hit at context.cache[origPos=#{context.code.pos}][#{cacheKey}]"
      context.code.commit cached.code
      return cached.result
    context.storeCache = yes
    result = fn.call this, context
    if cacheKey? and context.storeCache
      (context.cache[origPos]||={})[cacheKey] = result:result, code:context.code.clone()
    return result

  @$callback = (fn) -> (context) ->
    result = fn.call this, context
    result = @cb.call context, result if result isnt null and @cb?
    return result

  @$recurse = (fn) -> (context) ->
    if this isnt @rule then return fn.call this, context

    ###
      @pos X
      FOO:          "master"
        BAR:        "master"
          FOO:      "slave"
    ###
    
    # Get stackItem from the master, which proves recursive entry
    masterStackItem = null
    for i in [context.stack.length-1..0] by -1
      item = context.stack[i]
      break if item.pos < context.code.pos
      if item.name is @name
        masterStackItem = item
        break

    # If masterStackItem is null, this is the master.
    if not masterStackItem?
      origContext = context.clone()
      masterStackItem = name:@name, pos:context.code.pos, recursed:false
      context.stack.push masterStackItem
      result = fn.call this, context
      context.stack.pop()
      
      # If a self-recursion was encountered
      if result isnt null and masterStackItem.recursed
        loop
          # save state, this might be the answer
          lastGoodResult = result
          lastGoodContext = context.clone()
          # revert to original context, try again
          context.commit origContext
          masterStackItem.puppet = result
          context.stack.push masterStackItem
          result = fn.call this, context
          context.stack.pop()
          # return saved state
          if result is null
            context.commit lastGoodContext
            # before returning, reset CACHE...
            return lastGoodResult
      else
        # before returning, reset CACHE...
        return result

    else
      masterStackItem.recursed=true

    return
    ### DONE ###

    # Get stackItem from the same code position, which proves recursive entry
    stackItem = null
    for i in [context.stack.length-1..0] by -1
      item = context.stack[i]
      continue if item.pos < 0 # see #TAG_NEGATIVE_POS
      break if item.pos isnt context.code.pos
      if item.name is @name
        stackItem = item
        break

    # Nonrecursive + recursive-entrant case
    if not stackItem?
      stackItem = name:@name, pos:context.code.pos
      ###
      context.stack.push stackItem
      result = fn.call this, context
      context.stack.pop()
      return result if not stackItem.snowball? # nonrecursive
      if result isnt null and stackItem.snowball.code.pos < context.code.pos
        context.log "[R] NOT Recalling snowball = {pos:#{stackItem.snowball.code.pos}, value:#{stackItem.snowball.value}}"
        context.log "[R] NOT StackItem = {pos:#{stackItem.pos}}, context.code = {pos:#{context.code.pos}}, result=#{result}"
        return result
      else
        context.log "[R] Recalling snowball = {pos:#{stackItem.snowball.code.pos}, value:#{stackItem.snowball.value}}"
        context.log "[R] StackItem = {pos:#{stackItem.pos}}, context.code = {pos:#{context.code.pos}}, result=#{result}"
        context.code.commit stackItem.snowball.code
        context.log "[R] Final value..."
        return stackItem.snowball.value # recursive, final value
    ###

    # Beginning of recursive call.
    # Grow the snowball iteratively.
    if not stackItem.snowball?
      context.log "   [R] Re-entrant case"
      stackItem.snowball = snowball = value:null, code:context.code.clone()
      context.log "   [R] v-- probing... "
      loop
        clone = context.clone()
        context.log "   [R] clone.code.pos #{clone.code.pos}, snowball.code.pos: #{snowball.code.pos}"
        clone.stack.push {name:@name,pos:-stackItem.pos-1} #TAG_NEGATIVE_POS
        result = fn.call this, clone
        clone.stack.pop()
        context.log "   [R] result isnt null: #{result isnt null} snowball.code.pos: #{snowball.code.pos} clone.code.pos #{clone.code.pos}"
        context.log "   [R] deleting context.cache[#{stackItem.pos}][#{@name}]"
        delete context.cache[stackItem.pos][@name]
        if result isnt null and snowball.code.pos < clone.code.pos
          snowball.value = result
          snowball.code = clone.code
          context.log "   [R] ^-- got #{result}, #{snowball.code.pos}"
        else
          # done, final snowball.
          context.log "   [R] BBB"
          context.code.commit stackItem.snowball.code
          #if snowball.value is null
          #  context.log "deleteing"
          #delete stackItem.snowball if snowball.value is null
          context.log "   [R] ^-- return final snowball (again??)"
          return snowball.value

    # Just pass the snowball value, don't recurse.
    else
      context.log "[R] AAA"
      context.code.commit stackItem.snowball.code
      context.log "[R] ama puppet "
      return stackItem.snowball.value

  @$ruleLabel = (fn) -> (context) ->
    if this isnt @rule then return fn.call this, context
    result = fn.call this, context
    if @label? and @label not in ['@','&']
      result_ = {}
      result_[@label] = result
      result = result_
    return result

  @$debug = (fn) ->
    (context) ->
      if not context.debug then return fn.call this, context
      if this isnt @rule then return fn.call this, context
      rule = context.grammar.rules[@name]
      bufferStr = escape context.code.peek chars:20
      bufferStr = "[#{bufferStr}#{if bufferStr.length < 20 then ']' else '>'}"
      context.log "#{red @name}: #{blue rule} #{black bufferStr}"
      result = fn.call this, context
      context.log "^-- #{escape result} #{black typeof result}" if result isnt null
      return result

  @$wrap = (fn) ->
    @$contextResult @$cache @$debug @$recurse @$callback @$ruleLabel fn

  capture: yes
  init: ->
    # Bind all parse methods to this, and make the 
    # function always return $.
    # If the original @parse returns a value that is not $,
    # then the return value gets set to $.return.
    # (unless it's undefined)
    origParse = @parse
    assert.ok origParse, "Parse function is missing on node"
    @parse = ($) =>
      result = origParse.call this, $
      $.result = result if result isnt $ and result isnt undefined
      return $
      
  walk: ({pre, post}, parent=undefined) ->
    # pre, post: (parent, childNode) -> where childNode in parent.children.
    pre parent, @ if pre?
    if @children
      for child in @children
        if child not instanceof Node
          throw Error "Unexpected object encountered walking children: #{child}"
        child.walk {pre: pre, post:post}, @
    post parent, @ if post?
  prepare: -> # implement if needed
  toString: -> "[#{@constructor.name}]"
  _cb: (@cb) -> @
 
@Choice = Choice = clazz 'Choice', Node, ->
  init: (@choices) ->
    @super.init()
    @children = @choices
  parse: ($) ->
    for choice in @choices
      return if $.try(choice.parse).result isnt null
    $
  toString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

@Sequence = Sequence = clazz 'Sequence', Node, ->
  init: (@sequence) ->
    @super.init()
    @children = @sequence
  prepare: ->
    numCaptures = 0
    numLabels = 0
    for child in @children
      numLabels += 1 if child.label
      numCaptures += 1 if child.capture
    @type =
      if numLabels is 0
        if numCaptures > 1 then 'array' else 'single'
      else
        'object'
  parse: ($) ->
    switch @type
      when 'array'
        results = []
        for child in @sequence
          return if child.parse($).result is null
          results.push $.result if child.capture
        return results
      when 'single'
        result = null
        for child in @sequence
          return if child.parse($).result is null
          result = $.result if child.capture
        return result
      when 'object'
        results = {}
        for child in @sequence
          return if child.parse($).result is null
          if child.label is '&'
            results = _.extend $.result, results
          else if child.label is '@'
            _.extend results, $.result
          else if child.label?
            results[child.label] = $.result
        return results
    $
  toString: ->
    labeledStrs = for node in @sequence
      if node.label?
        "#{cyan node.label}#{blue ':'}#{node}"
      else
        ''+node
    blue("(")+(labeledStrs.join ' ')+blue(")")

@Lookahead = Lookahead = clazz 'Lookahead', Node, ->
  capture: no
  init: ({@words, @chars}) ->
    @super.init()
  parse: ($) -> $.code.peek words:@words, chars:@chars
  toString: -> yellow if @words? then "<words:#{@words}>" else "<chars:#{@chars}>"

@Exists = Exists = clazz 'Exists', Node, ->
  init: (@it) ->
    @super.init()
    @children = [@it]
  parse: ($) ->
    $.try @it.parse
    $.result ?= undefined
  toString: -> ''+@it+blue("?")

@Pattern = Pattern = clazz 'Pattern', Node, ->
  init: ({@value, @join, @min, @max}) ->
    @super.init()
    @children = if @join? then [@value, @join] else [@value]
  parse: ($) ->
    matches = []
    $.try =>
      @value.parse $
      return if $.result is null
      matches.push $.result
      loop
        action = $.try =>
          if @join?
            @join.parse $
            return 'break' if $.result is null
          @value.parse $
          return 'break' if $.result is null
          matches.push $.result
          return 'break' if @max? and matches.length >= @max
        break if action is 'break'
    return null if @min? and @min > matches.length
    return matches
  toString: -> ''+@value+blue("*{")+(@join||'')+blue(";")+(@min||'')+blue(",")+(@max||'')+blue("}")

@Not = Not = clazz 'Not', Node, ->
  capture: no
  init: (@it) ->
    @super.init()
    @children = [@it]
  parse: ($) ->
    pos = @code.pos
    @it.parse $
    @code.pos = pos
    return null if $.result isnt null
    $.result = undefined
    $
  toString: -> "#{yellow '!'}#{@it}"

@Ref = Ref = clazz 'Ref', Node, ->
  init: (@key) ->
    @super.init()
  parse: ($) ->
    if @key in ['$', '$$']
      @choices.parse $
    else
      node = $.grammar.rules[@key]
      throw Error "Unknown reference #{@key}" if not node?
      node.parse $
    $
  toString: -> red(@key)

@String = String = clazz 'String', Node, ->
  init: (@str) ->
    @super.init()
  parse: ($) -> $.code.match string:@str
  toString: -> green("'#{escape @str}'")

@Regex = Regex = clazz 'Regex', Node, ->
  init: (@reStr) ->
    @super.init()
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '^'+@reStr
  parse: ($) -> $.code.match regex:@re
  toString: -> magenta(''+@re)

@Nodeling = Nodeling = clazz 'Nodeling', ->
  init: ({@rule, @cb}) ->
  parse: -> (GRAMMAR.parse @rule).result._cb @cb

@Rank = Rank = clazz 'Rank', Node, ->
  init: (rules) ->
    @super.init()
    [@rules, @includes, @children] = [[],[],[]]
    @addRules rules, @rules
  addRules: (rules, target) ->
    for name, rule of rules
      thisTarget = target
      # convenience for dict of includes
      if name.trim().length is 0
        assert.ok typeof rule is 'object'
        @addRules rule, @includes
        break

      if rule instanceof Nodeling
        rule = rule.parse()
      else if rule not instanceof Node
        if rule instanceof Object
          rule = Rank rule
        else
          throw new Error "Unknown type (#{typeof rule}) for rule: #{rule}"

      if name[0] is ' '
        thisTarget = @includes
        name = name.trim()

      rule.name = name
      rule.index = @children.length
      rule.rule = rule
      thisTarget[name] = rule
      @children.push rule
  parse: ($) ->
    $.result = null
    for own name, node of @rules
      $.try node.parse
      return if $.result isnt null
    $
  toString: -> "#{_.keys(@rules).join ' | '}"

@Grammar = Grammar = clazz 'Grammar', Node, ->
  init: (rules) ->
    @super.init()
    rules = rules(MACROS) if typeof rules is 'function'
    @rank = Rank rules
    @rules = {}
    # initial setup
    @rank.walk
      pre: (parent, node) =>
        if node.parent?
          throw Error 'Grammar tree should be a DAG, nodes should not be referenced more than once.'
        # set node.parent, the immediate parent node
        node.parent = parent
        # set node.rule, the root node for this rule
        node.rule ||= parent?.rule
        # dereference all rules
        if node instanceof Rank
          assert.equal (inter = _.intersection _.keys(@rules), _.keys(node.rules)).length, 0, "Duplicate key(s): #{inter.join ','}"
          _.extend @rules, node.rules
          if node.includes?
            assert.equal (inter = _.intersection _.keys(@rules), _.keys(node.includes)).length, 0, "Duplicate key(s): #{inter.join ','}"
            _.extend @rules, node.includes
        # setup $/$$
        else if node instanceof Ref and node.key in ['$', '$$']
          rank = node.rule.parent
          # construct implicit choices
          node.choices = Choice rank.children.filter (rule) -> rule.index > node.rule.index
          node.choices.children.unshift Ref node.rule.name if node.key is '$$'
          
      post: (parent, node) =>
        # call prepare on all nodes
        node.prepare()
  parse: (code, start='START', debug=false) ->
    code = CodeStream code if code not instanceof CodeStream
    context = Context code, this
    context.debug = debug
    Ref(start).parse context
    throw Error "incomplete parse: [#{context.code.peek chars:10}]" if context.code.pos isnt context.code.text.length
    return context

C  = -> Choice (x for x in arguments) # TODO ugh
E  = -> Exists arguments...
L  = (label, node) -> node.label = label; node
La = -> Lookahead arguments...
N  = -> Not arguments...
P  = (value, join, min, max) -> Pattern value:value, join:join, min:min, max:max
R  = -> Ref arguments...
Re = -> Regex arguments...
S  = -> Sequence (x for x in arguments)
St = -> String arguments...

@GRAMMAR = GRAMMAR = Grammar
  START:                R('EXPR')
  EXPR:
    EXPR_:              S(L('&',R('$')), R('_'))
    CHOICE:             P(R('$'), S(R('_'), St('|')), 2)._cb Choice
    SEQUENCE:           P(R('$'), null, 2)._cb Sequence
    UNIT:
      _UNIT:            S(R('_'), L('&',R('$')))
      COMMAND:
        LA_CHAR:        S(St('<chars:'), L('chars',R('INT')), St('>'))._cb Lookahead
        LA_WORD:        S(St('<words:'), L('words',R('INT')), St('>'))._cb Lookahead
      LABELED:          S(L('@', E(S(L('label',R('LABEL')), St(':')))),
                          L('&',R('$')))
      DECORATED:
        EXISTS:         S(L('&',R('PRIMARY')), St('?'))._cb Exists
        PATTERN:        S(L('value',R('PRIMARY')), St('*'),
                          L('@', E(S(St('{'),
                              L('join',E(R('EXPR'))), St(';'),
                              R('_'), L('min', E(R('INT'))), R('_'), St(','),
                              R('_'), L('max', E(R('INT'))), R('_'), St('}')))))._cb Pattern
        NOT:            S(St('!'), L('&',R('PRIMARY')))._cb Not
      PRIMARY:
        REF:            C(St('$$'), St('$'), R('WORD'))._cb Ref
        PAREN:          S(St('('), L('&',R('EXPR')), St(')'))
        STRING:         S(St("'"),
                          L('&',P(S(N(St("'")),
                                    C(R('ESC1'), R('.'))))),
                          St("'"))._cb (it) -> String it.join ''
        REGEX:          S(St('/'),
                          L('&',P(S(N(St('/')),
                                    C(R('ESC2'), R('.'))))),
                          St('/'))._cb (it) -> Regex it.join ''
        '':
          ESC1:         S(St('\\'), L('&',R('.')))
          ESC2:         S(St('\\'), R('.'))._cb (it) -> it.join ''
  '':
    NUMERIC:
      INT:              S(La(words:1), Re('[0-9]+'))._cb Number
    OTHER:
      LABEL:            C(St('&'), St('@'), R('WORD'))
      WORD:             S(La(words:1), Re('[a-zA-Z\\._][a-zA-Z\\._0-9]*'))
      '.':              S(La(chars:1), Re('[\\s\\S]'))
      ESC_CHAR:         S(La(chars:2), Re('\\\\[\\s\\S]'))
      _:                P(C(R('WHITESPACE'), R('TERM')))
      TERM:             St("\n")
      WHITESPACE:       S(La(words:1), Re(' +'))

@MACROS = MACROS =
  o: (rule, cb) -> Nodeling rule:rule, cb:cb
  t: (tokens...) ->
    cb = tokens.pop() if typeof tokens[tokens.length-1] is 'function'
    rank = {}
    for token in tokens
      rank[token.toUpperCase()] = Nodeling rule:"__ &:'#{token}'", cb:cb
    rank
