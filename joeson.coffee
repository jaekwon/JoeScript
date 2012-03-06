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

# aka '$'
@Context = Context = clazz 'Context', ->

  # stack = [ {name, pos, snowball?:{value,endPos} }... ]
  # cache["#{@rule.name}@#{$.code.pos}"] = {result,endPos}
  # recurse["#{@rule.name}@#{$.code.pos}"] = {stage,puppet}
  # recurse[$.code.pos] = 'nocache' || undefined
  init: (@code, @grammar, @stack=[], @cache={}, @recurse={}, @debug) ->
    @storeCache = true

  # A block of code, result must be non-null
  # Otherwise code.pos will be reverted.
  try: (fn) ->
    pos = @code.pos
    result = fn.call this
    @code.pos = pos if result isnt null
    result

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

  @$stack = (fn) -> ($) ->
    stackItem = name:@name, pos:startPos
    @stack.push stackItem
    result = fn.call this, $
    @stack.pop()
    return result

  @$debug = (fn) ->
    ($) ->
      if not $.debug then return fn.call this, $
      if this isnt @rule then return fn.call this, $
      rule = $.grammar.rules[@name]
      bufferStr = escape $.code.peek chars:20
      bufferStr = "[#{bufferStr}#{if bufferStr.length < 20 then ']' else '>'}"
      $.log "#{red @name}: #{blue rule} #{black bufferStr}"
      result = fn.call this, $
      $.log "^-- #{escape result} #{black typeof result}" if result isnt null
      return result

  @$cache = (fn) -> ($) ->
    if this isnt @rule then return fn.call this, $
    $.log "[C] rule #{@name}"
    cacheKey = @name
    if cacheKey? and (cached=$.cache["#{cacheKey}@#{origPos=$.code.pos}"])?
      $.log "[C] Cache hit at $.cache[\"#{cacheKey}@#{origPos}\"]"
      $.code.pos = cached.endPos
      return cached.result
    $.storeCache = yes
    result = fn.call this, $
    if cacheKey? and $.storeCache and $.recurse[origPos] isnt 'nocache'
      $.cache["#{cacheKey}@#{origPos}"] ||= result:result, endPos:$.code.pos
    return result

  @$loopify = (fn) -> ($) ->
    if this isnt @rule then return fn.call this, $

    key = "#{@name}@#{$.code.pos}"
    item = @recurse[key] ||= stage:0

    switch item.stage
      when 0 # non-recursive (so far)
        item.stage = 1
        startPos = $.code.pos
        result = fn.call this, $
        switch item.stage
          when 1
            return result
          when 2
            if result is null
              delete @recurse[$.code.pos]
              return result
            else
              item.stage = 3
              while result isnt null
                goodResult = result
                goodPos = $.code.pos
                item.puppet = loopResult
                $.code.pos = startPos
                result = fn.call this, $
                assert.equal item.stage, 3, 'this shouldnt change'
              $.code.pos = goodPos
              delete @recurse[$.code.pos]
              return goodResult
          else
            throw new Error 'this should not happen foo'
      when 1 # recursion detected
        item.stage = 2
        @recurse[$.code.pos] = 'nocache'
        return null
      when 3 # loopified case
        return item.puppet
      else
        throw new Error 'this should not happen bar'

  @$ruleCallback = (fn) -> ($) ->
    result = fn.call this, $
    result = @cb.call $, result if result isnt null and @cb?
    return result

  @$ruleLabel = (fn) -> ($) ->
    if this isnt @rule then return fn.call this, $
    result = fn.call this, $
    if @label? and @label not in ['@','&']
      result_ = {}
      result_[@label] = result
      result = result_
    return result

  @$wrap = (fn) ->
    @$stack @$debug @$cache @$loopify @$ruleCallback @$ruleLabel fn

  capture: yes
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
    @children = @choices
  parse: ($) ->
    for choice in @choices
      result = $.try choice.parse
      return result if result isnt null
    return null
  toString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

@Sequence = Sequence = clazz 'Sequence', Node, ->
  init: (@sequence) ->
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
          res = child.parse $
          return null if res is null
          results.push res if child.capture
        return results
      when 'single'
        result = null
        for child in @sequence
          res = child.parse $
          return null if res is null
          result = res if child.capture
        return result
      when 'object'
        results = {}
        for child in @sequence
          res = child.parse $
          return null if res is null
          if child.label is '&'
            results = _.extend res, results
          else if child.label is '@'
            _.extend results, res
          else if child.label?
            results[child.label] = res
        return results
    return null
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
  parse: ($) -> $.code.peek words:@words, chars:@chars
  toString: -> yellow if @words? then "<words:#{@words}>" else "<chars:#{@chars}>"

@Exists = Exists = clazz 'Exists', Node, ->
  init: (@it) ->
    @children = [@it]
  parse: ($) ->
    res = $.try @it.parse
    return res ? undefined
  toString: -> ''+@it+blue("?")

@Pattern = Pattern = clazz 'Pattern', Node, ->
  init: ({@value, @join, @min, @max}) ->
    @children = if @join? then [@value, @join] else [@value]
  parse: ($) ->
    matches = []
    $.try =>
      resV = @value.parse $
      return if resV is null
      matches.push resV
      loop
        action = $.try =>
          if @join?
            resJ = @join.parse $
            # return null to revert pos
            return null if resJ is null
          resV = @value.parse $
          # return null to revert pos
          return null if resV is null
          matches.push resV
          return 'break' if @max? and matches.length >= @max
        break if action in ['break', null]
    return null if @min? and @min > matches.length
    return matches
  toString: -> ''+@value+blue("*{")+(@join||'')+blue(";")+(@min||'')+blue(",")+(@max||'')+blue("}")

@Not = Not = clazz 'Not', Node, ->
  capture: no
  init: (@it) ->
    @children = [@it]
  parse: ($) ->
    pos = @code.pos
    res = @it.parse $
    @code.pos = pos
    return
      if res isnt null then null
      else undefined
  toString: -> "#{yellow '!'}#{@it}"

@Ref = Ref = clazz 'Ref', Node, ->
  init: (@key) ->
  parse: ($) ->
    return
      if @key in ['$', '$$']
        @choices.parse $
      else
        node = $.grammar.rules[@key]
        throw Error "Unknown reference #{@key}" if not node?
        node.parse $
  toString: -> red(@key)

@String = String = clazz 'String', Node, ->
  init: (@str) ->
  parse: ($) -> $.code.match string:@str
  toString: -> green("'#{escape @str}'")

@Regex = Regex = clazz 'Regex', Node, ->
  init: (@reStr) ->
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '^'+@reStr
  parse: ($) -> $.code.match regex:@re
  toString: -> magenta(''+@re)

@Nodeling = Nodeling = clazz 'Nodeling', ->
  init: ({@rule, @cb}) ->
  parse: -> GRAMMAR.parse(@rule)._cb @cb

@Rank = Rank = clazz 'Rank', Node, ->
  init: (rules) ->
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
    result = null
    for own name, node of @rules
      result = $.try node.parse
      return result if result isnt null
    null
  toString: -> "#{_.keys(@rules).join ' | '}"

@Grammar = Grammar = clazz 'Grammar', Node, ->
  init: (rules) ->
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
    $ = Context code, this
    $.debug = debug
    result = Ref(start).parse $
    throw Error "incomplete parse: [#{$.code.peek chars:10}]" if $.code.pos isnt $.code.text.length
    return result

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
