###
JoeSon Parser
Jae Kwon 2012
###

_ = require 'underscore'
assert = require 'assert'
{inspect, CodeStream} = require './codestream'
{clazz} = require 'cardamom'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'

Context = clazz [@,'Context'], ->
  init: (@code, @grammar, @stack=[], @cache={}, @result) ->
    # stack = [ {name, pos, snowball?:{value,endPos} }... ]
    # cache[context.code.pos][@rule.name] = {result,endPos}
  clone: -> Context @code.clone(), @grammar, @stack, @cache, @result
  commit: (clone) ->
    @code.commit clone.code
    @result = clone.result
  try: (cb_context) ->
    clone = @clone()
    result = cb_context(clone)
    @commit clone if result?
    return result
  debug: -> console.log arguments...

###
In addition to the attributes defined by subclasses,
  the following attributes exist for all nodes.

  node.rule = The topmost node of a rule.

For the topmost node of a rule called `rule`,

  rule == rule.rule # this is @rule

And rule.name is the name (key) for the rule.
###
Node = clazz [@,'Node'], ->

  @$contextResult = (fn) -> (context) ->
    return context.result = fn.call this, context

  @$cache = (fn) -> (context) ->
    if this isnt @rule then return context.result = fn.call this, context
    cacheKey = @name
    if cacheKey? and (cached=context.cache[origPos=context.code.pos]?[cacheKey])?
      context.code.commit cached.code
      return cached.result
    result = fn.call this, context
    if cacheKey?
      (context.cache[origPos]||={})[cacheKey] = result:result, code:context.code.clone()
    return result

  @$callback = (fn) -> (context) ->
    result = fn.call this, context
    result = @cb result if result? and @cb?
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
        if result? and snowball.code.pos < clone.code.pos
          snowball.value = result
          snowball.code = clone.code
        else
          # done, final snowball.
          return snowball.value

    # Just pass the snowball value, don't recurse.
    else
      context.code.commit stackItem.snowball.code
      return stackItem.snowball.value

  @$debug = (fn) ->
    return fn # disabled
    (context) ->
      if this isnt @rule then return fn.call this, context
      rule = context.grammar.rules[@name]
      context.debug cyan(Array(context.stack.length+1).join('|  '))+
            red(@name)+': '+blue(rule)+" "+
            black("["+context.code.peek(chars:20)+"]")
      result = fn.call this, context
      context.debug "#{cyan Array(context.stack.length+1).join('|  ')+"^--"} #{result} #{black typeof result}" if result?
      return result

  @$wrap = (fn) ->
    @$contextResult @$cache @$debug @$recurse @$callback fn

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
 
Choice = clazz [@,'Choice'], Node, ->
  init: (@choices) -> @children = @choices
  parse$: @$wrap (context) ->
    for choice in @choices
      result = context.try choice.parse
      return result if result?
    null
  toString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

Sequence = clazz [@,'Sequence'], Node, ->
  init: (@sequence) -> @children = @sequence
  prepare: ->
    @hasLabel = _.any (child.label for child in @children)
  parse$: @$wrap (context) ->
    results = null # an object or array
    # TODO cannot say name = for expr then return
    for child in @sequence
      childResult = child.parse context
      return null if not childResult?
      if child.label is '&'
        results = _.extend childResult, results
      else if child.label is '@'
        _.extend (results||={}), childResult
      else if child.label?
        (results||={})[child.label] = childResult
      else if child.capture and not @hasLabel
        (results||=[]).push childResult
    # can happen if one of the elements is a command
    return results[0] if not @hasLabel and results.length is 1
    return if _.isEmpty results then null else results
  toString: ->
    labeledStrs = for node in @sequence
      if node.label?
        "#{cyan node.label}#{blue ':'}#{node}"
      else
        ''+node
    blue("(")+(labeledStrs.join ' ')+blue(")")

Lookahead = clazz [@,'Lookahead'], Node, ->
  capture: no
  init: ({@words, @chars}) ->
  parse$: @$wrap (context) -> context.code.peek words:@words, chars:@chars
  toString: -> yellow if @words? then "<words:#{@words}>" else "<chars:#{@chars}>"

Exists = clazz [@,'Exists'], Node, ->
  init: (@it) -> @children = [@it]
  parse$: @$wrap (context) ->
    result = context.try (context) =>
      @it.parse context
    result or ''
  toString: -> ''+@it+blue("?")

Pattern = clazz [@,'Pattern'], Node, ->
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
          return 'break' if matches.length >= @max
          return 'continue'
        )
        break if result in [null, 'break']
    return null if @min? and @min > matches.length
    return matches
  toString: -> ''+@value+blue("*{")+(@join||'')+blue(";")+(@min||'')+blue(",")+(@max||'')+blue("}")

Not = clazz [@,'Not'], Node, ->
  capture: no
  init: (@it) -> @children = [@it]
  parse$: @$wrap (context) ->
    context = context.clone()
    peekResult = @it.parse context
    return if peekResult? then null else 'NoMatch'
  toString: -> "#{yellow '!'}#{@it}"

Ref = clazz [@,'Ref'], Node, ->
  init: (@key) ->
  parse$: @$wrap (context) ->
    if @key is '$'
      @choices.parse context
    else
      node = context.grammar.rules[@key]
      throw Error "Unknown reference #{@key}" if not node?
      node.parse context
  toString: -> red(@key)

String = clazz [@,'String'], Node, ->
  init: (@str) ->
  parse$: @$wrap (context) -> context.code.match string: @str
  toString: -> green("'#{@str.replace('\\', '\\\\').replace("'", "\\'")}'")

Regex = clazz [@,'Regex'], Node, ->
  init: (@reStr) ->
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '^'+@reStr
  parse$: @$wrap (context) -> context.code.match(regex: @re)
  toString: -> magenta(''+@re)

Rank = clazz [@,'Rank'], Node, ->
  init: (@rules) ->
    @children = []
    for name, rule of @rules
      if rule not instanceof Node
        rule = @rules[name] = Rank rule
      rule.name = name
      rule.index = @children.length
      rule.rule = rule
      @children.push rule
  parse$: @$wrap (context) ->
    for own name, node of @rules
      result = context.try node.parse
      return result if result?
  toString: -> "#{_.keys(@rules).join ' | '}"

Grammar = clazz [@,'Grammar'], Node, ->
  init: (rules) ->
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
        # setup $/$$
        else if node instanceof Ref and node.key in ['$', '$$']
          rank = node.rule.parent
          # construct implicit choices
          node.choices = Choice rank.children.filter (rule) -> rule.index > node.rule.index
          node.rule.recursive = yes if node.key is '$$'
      post: (parent, node) =>
        # call prepare on all nodes
        node.prepare()
  parse$: (context, start='START') ->
    context.grammar = @
    Ref(start).parse context

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

UNTIL = (nGen) -> P(S(N(nGen()),
                      C(S(St('\\'),
                          L('&',R('.'))),
                        R('.'))))

GRAMMAR = Grammar
  START:                R('EXPR')
  EXPR:
    EXPR_:              S(L('&',R('$')), R('_'))._cb                              ($1) -> $1
    CHOICE:             P(R('$'), S(R('_'), St('|')), 2)._cb                      ($1) -> Choice $1
    SEQUENCE:           P(R('$'), null, 2)._cb                                    ($1) -> Sequence $1
    UNIT:
      _UNIT:            S(R('_'), L('&',R('$')))
      COMMAND:
        LA_CHAR:        S(St('<chars:'), L('chars',R('INT')), St('>'))._cb        ($1) -> Lookahead $1
        LA_WORD:        S(St('<words:'), L('words',R('INT')), St('>'))._cb        ($1) -> Lookahead $1
      LABELED:          S(L('@', E(S(L('label',R('LABEL')), St(':')))),
                          L('&',R('$')))
      DECORATED:
        EXISTS:         S(L('&',R('PRIMARY')), St('?'))._cb                       ($1) -> Exists $1
        PATTERN:        S(L('value',R('PRIMARY')), St('*'),
                          L('@', E(S(St('{'),
                              L('join',E(R('EXPR'))), St(';'),
                              R('_'), L('min', E(R('INT'))), R('_'), St(','),
                              R('_'), L('max', E(R('INT'))), R('_'), St('}')))))._cb ($1) -> Pattern $1
        NOT:            S(St('!'), L('&',R('PRIMARY')))._cb                       ($1) -> Not $1
      PRIMARY:
        REF:            C(St('$$'), St('$'), R('WORD'))._cb                       ($1) -> Ref $1
        PAREN:          S(St('('), L('&',R('EXPR')), St(')'))
        STRING:         S(St("'"), L('&', UNTIL(->St("'"))), St("'"))._cb         ($1) -> String $1.join ''
        REGEX:          S(St("/"), L('&', UNTIL(->St("/"))), St("/"))._cb         ($1) -> Regex $1.join ''
  NUMERIC:
    INT:                S(La(words:1), Re('[0-9]+'))._cb                          ($1) -> Number $1
  OTHER:
    LABEL:              C(St('&'), St('@'), R('WORD'))
    WORD:               S(La(words:1), Re('[a-zA-Z\\._]+'))
    '.':                C(R('TERM'), S(La(chars:1), Re('.')))
    _:                  P(C(R('WHITESPACE'), R('TERM')))
    TERM:               St("\n")
    WHITESPACE:         S(La(words:1), Re(' +'))

@parseGrammar = ({code}) ->
  code = CodeStream code if code not instanceof CodeStream
  context = Context code
  GRAMMAR.parse context
  context
