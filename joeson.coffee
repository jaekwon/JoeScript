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
  init: (@code, @grammar, @stack=[], @cache={}, @result) ->
    # stack = [ {name, pos, snowball?:{value,endPos} }... ]
    # cache[context.code.pos][@rule.name] = {result,endPos}
  clone: ->
    Context @code.clone(), @grammar, @stack, @cache, @result
  commit: (clone) ->
    @code.commit clone.code
    @result = clone.result
  try: (cb_context) ->
    clone = @clone()
    result = cb_context(clone)
    @commit clone if result isnt null
    return result
  debug: -> console.log arguments...

###
In addition to the attributes defined by subclasses,
  the following attributes exist for all nodes.

node.rule = The topmost node of a rule.
node.rule = rule # sometimes true.
node.name = name of the rule, if this is @rule.

###
@Node = Node = clazz 'Node', ->

  @$contextResult = (fn) -> (context) ->
    return context.result = fn.call this, context

  @$cache = (fn) -> (context) ->
    if this isnt @rule then return context.result = fn.call this, context
    cacheKey = @name
    if cacheKey? and (cached=context.cache[origPos=context.code.pos]?[cacheKey])?
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
      context.stack.push stackItem
      result = fn.call this, context
      context.stack.pop()
      return result if not stackItem.snowball? # nonrecursive
      context.code.commit stackItem.snowball.code
      return stackItem.snowball.value # recursive, final value

    # Beginning of recursive call.
    # Grow the snowball iteratively.
    if not stackItem.snowball?
      stackItem.snowball = snowball = value:null, code:context.code.clone()
      loop
        clone = context.clone()
        context.stack.push {name:@name,pos:-stackItem.pos-1} #TAG_NEGATIVE_POS
        result = fn.call this, clone
        context.stack.pop()
        delete context.cache[stackItem.pos][@name]
        if result isnt null and snowball.code.pos < clone.code.pos
          snowball.value = result
          snowball.code = clone.code
        else
          # done, final snowball.
          return snowball.value

    # Just pass the snowball value, don't recurse.
    else
      context.code.commit stackItem.snowball.code
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
    # return fn # disabled 
    (context) ->
      if this isnt @rule then return fn.call this, context
      rule = context.grammar.rules[@name]
      context.debug cyan(Array(context.stack.length+1).join('|  '))+
            red(@name)+': '+blue(rule)+" "+
            black("["+(buffer=(escape (context.code.peek chars:20)))+(if buffer.length < 20 then "]" else ">"))
      result = fn.call this, context
      context.debug "#{cyan Array(context.stack.length+1).join('|  ')+"^--"} #{escape result} #{black typeof result}" if result isnt null
      return result

  @$wrap = (fn) ->
    @$contextResult @$cache @$debug @$recurse @$callback @$ruleLabel fn

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
  parse$: @$wrap (context) -> throw Error 'NotImplemented'
  toString: -> "[#{@constructor.name}]"
  _cb: (@cb) -> @
 
@Choice = Choice = clazz 'Choice', Node, ->
  init: (@choices) ->
    @children = @choices
  parse$: @$wrap (context) ->
    for choice in @choices
      result = context.try choice.parse
      return result if result isnt null
    null
  toString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

@Sequence = Sequence = clazz 'Sequence', Node, ->
  init: (@sequence) -> @children = @sequence
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
  parse$: @$wrap (context) ->
    switch @type
      when 'array'
        results = []
        for child in @sequence
          childResult = child.parse context
          return null if childResult is null
          results.push childResult if child.capture
        return results
      when 'single'
        result = null
        for child in @sequence
          childResult = child.parse context
          return null if childResult is null
          result = childResult if child.capture
        return result
      when 'object'
        results = {}
        for child in @sequence
          childResult = child.parse context
          return null if childResult is null
          if child.label is '&'
            results = _.extend childResult, results
          else if child.label is '@'
            _.extend results, childResult
          else if child.label?
            results[child.label] = childResult
        return results
    null
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
  parse$: @$wrap (context) ->
    context.code.peek words:@words, chars:@chars
  toString: -> yellow if @words? then "<words:#{@words}>" else "<chars:#{@chars}>"

@Exists = Exists = clazz 'Exists', Node, ->
  init: (@it) ->
    @children = [@it]
  parse$: @$wrap (context) ->
    result = context.try (context) =>
      @it.parse context
    result ? undefined # not null, so is a valid match.
  toString: -> ''+@it+blue("?")

@Pattern = Pattern = clazz 'Pattern', Node, ->
  init: ({@value, @join, @min, @max}) ->
    @children = if @join? then [@value, @join] else [@value]
  parse$: @$wrap (context) ->
    matches = []
    context.try (context) =>
      return null unless (match = @value.parse context)?
      matches.push match
      loop
        result = (context.try (context) =>
          if @join?
            return null unless (join = @join.parse context)?
          return null unless (match = @value.parse context)?
          matches.push match
          return 'break' if @max? and matches.length >= @max
          return 'continue'
        )
        break if result in [null, 'break']
    return null if @min? and @min > matches.length
    return matches
  toString: -> ''+@value+blue("*{")+(@join||'')+blue(";")+(@min||'')+blue(",")+(@max||'')+blue("}")

@Not = Not = clazz 'Not', Node, ->
  capture: no
  init: (@it) ->
    @children = [@it]
  parse$: @$wrap (context) ->
    context = context.clone()
    peekResult = @it.parse context
    return if peekResult? then null else 'NoMatch'
  toString: -> "#{yellow '!'}#{@it}"

@Ref = Ref = clazz 'Ref', Node, ->
  init: (@key) ->
  parse$: @$wrap (context) ->
    if @key in ['$', '$$']
      @choices.parse context
    else
      node = context.grammar.rules[@key]
      throw Error "Unknown reference #{@key}" if not node?
      node.parse context
  toString: -> red(@key)

@String = String = clazz 'String', Node, ->
  init: (@str) ->
  parse$: @$wrap (context) -> context.code.match string: @str
  toString: -> green("'#{escape @str}'")

@Regex = Regex = clazz 'Regex', Node, ->
  init: (@reStr) ->
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '^'+@reStr
  parse$: @$wrap (context) -> context.code.match(regex: @re)
  toString: -> magenta(''+@re)

@Nodeling = Nodeling = clazz 'Nodeling', ->
  init: ({@rule, @cb}) ->
  parse: -> (GRAMMAR.parse @rule).result._cb @cb

@Rank = Rank = clazz 'Rank', Node, ->
  init: (rules) ->
    @rules = _.clone rules
    @deps = null
    @children = []
    for name, rule of @rules
      if rule instanceof Nodeling
        rule = @rules[name] = rule.parse()
      else if rule not instanceof Node
        rule = @rules[name] = Rank rule
      if name.length is 0 or name[0] is ' '
        delete @rules[name]
        name = name.trim()
        (@deps||={})[name] = rule
      rule.name = name
      rule.index = @children.length
      rule.rule = rule
      @children.push rule
  parse$: @$wrap (context) ->
    for own name, node of @rules
      result = context.try node.parse
      return result if result isnt null
    null
  toString: -> "#{_.keys(@rules).join ' | '}"

@Grammar = Grammar = clazz 'Grammar', Node, ->
  macros =
    o: (rule, cb) -> Nodeling rule: rule, cb: cb
  init: (rules) ->
    rules = rules macros if typeof rules is 'function'
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
          _.extend @rules, node.rules
          _.extend @rules, node.deps if node.deps?
        # setup $/$$
        else if node instanceof Ref and node.key in ['$', '$$']
          rank = node.rule.parent
          # construct implicit choices
          node.choices = Choice rank.children.filter (rule) -> rule.index > node.rule.index
          node.choices.children.unshift Ref node.rule.name if node.key is '$$'
          
      post: (parent, node) =>
        # call prepare on all nodes
        node.prepare()
  parse$: (code, start='START') ->
    code = CodeStream code if code not instanceof CodeStream
    context = Context code, this
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
