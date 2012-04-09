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

debugLoopify = debugCache = no

# aka '$'
@Context = Context = clazz 'Context', ->

  init: (@code, @grammar, @debug=false) ->
    @stack = []         # [ {name,pos}... ]
    @cache = {}         # { "#{rulename}@#{pos}":{result,endPos}... }
    @cacheStores = []   # [ "#{rulename}@#{pos}"... ]
    @recurse = {}       # { "#{rulename}@#{pos}":{stage,base,endPos}... }
    @storeCache = yes   # rule callbacks can override this
    @_ctr = 0

  # code.pos will be reverted if result is null
  try: (fn) ->
    pos = @code.pos
    result = fn(this)
    @code.pos = pos if result is null
    result

  log: (message, count=false) ->
    if @debug
      if count
        console.log "#{++@_ctr}\t#{cyan Array(@stack.length-1).join '|'}#{message}"
      else
        console.log "#{@_ctr}\t#{cyan Array(@stack.length-1).join '|'}#{message}"

  cacheSet: (key, value) ->
    if not @cache[key]?
      @cache[key] = value
      @cacheStores.push key
    else
      throw new Error "Cache store error @ $.cache[\"#{key}\"]: existing entry"

  cacheMask: (pos, stopKey) ->
    stash = []
    cachePosSuffix = "@#{pos}"
    for i in [@cacheStores.length-1..0] by -1
      cacheKey = @cacheStores[i]
      continue if cacheKey[cacheKey.length-cachePosSuffix.length..] isnt cachePosSuffix
      cacheValue = @cache[cacheKey]
      delete @cache[cacheKey]
      stash.push {cacheKey, cacheValue}
      break if cacheKey is stopKey
    stash

  cacheDelete: (key) -> # key := "#{rulename}@#{pos}"
    assert.ok @cache[key]?, "Cannot delete missing cache item at key #{key}"
    cacheStoresIdx = @cacheStores.indexOf key
    assert.ok cacheStoresIdx, "cacheStores[] is missing an entry for #{key}"
    delete @cache[key]
    @cacheStores.splice cacheStoresIdx, 1

###
  In addition to the attributes defined by subclasses,
    the following attributes exist for all nodes.
  node.rule = The topmost node of a rule.
  node.rule = rule # sometimes true.
  node.name = name of the rule, if this is @rule.
###
@Node = Node = clazz 'Node', ->

  @$stack = (fn) -> ($) ->
    if this isnt @rule then return fn.call this, $
    stackItem = name:@name, pos:$.code.pos
    $.stack.push stackItem
    result = fn.call this, $
    popped = $.stack.pop()
    assert.ok stackItem is popped
    return result

  @$debug = (fn) -> ($) ->
    if not $.debug or this isnt @rule then return fn.call this, $
    #rule = $.grammar.rules[@name]
    bufferStr = escape $.code.peek chars:20
    bufferStr = if bufferStr.length < 20 then '['+bufferStr+']' else '['+bufferStr+'>'
    $.log "#{red @name}: #{blue this} #{black bufferStr}", true
    result = fn.call this, $
    $.log "^-- #{escape result} #{black typeof result}", true if result isnt null
    return result

  @$cache = (fn) -> ($) ->
    if this isnt @rule or @disableCache then return fn.call this, $
    pos = $.code.pos
    cacheKey = "#{@name}@#{pos}"
    if (cached=$.cache[cacheKey])?
      $.log "[C] Cache hit @ $.cache[\"#{cacheKey}\"]: #{escape cached.result}" if debugCache
      $.code.pos = cached.endPos
      return cached.result
    # $.storeCache = yes
    result = fn.call this, $
    if $.storeCache
      if not $.cache[cacheKey]?
        $.log "[C] Cache store @ $.cache[\"#{cacheKey}\"]: #{escape result}" if debugCache
        $.cacheSet cacheKey, result:result, endPos:$.code.pos
      else
        throw new Error "Cache store error @ $.cache[\"#{cacheKey}\"]: existing entry"
    else
      # reset
      $.storeCache = yes
      $.log "[C] Cache store skipped manually." if debugCache
    return result

  @$loopify = (fn) -> ($) ->
    if this isnt @rule then return fn.call this, $

    key = "#{@name}@#{$.code.pos}"
    item = $.recurse[key] ||= stage:0

    switch item.stage
      when 0 # non-recursive (so far)
        item.stage = 1
        startPos = $.code.pos
        startCacheLength = $.cacheStores.length
        result = fn.call this, $
        #try
        switch item.stage
          when 1 # non-recursive (done)
            delete $.recurse[key]
            return result
          when 2 # recursion detected
            if result is null
              $.log "[L] returning #{escape result} (no result)" if debugLoopify
              $.cacheDelete key
              delete $.recurse[key]
              return result
            else
              $.log "[L] --- loop start --- (#{key}) (initial result was #{escape result})" if debugLoopify
              item.stage = 3
              while result isnt null
                $.log "[L] --- loop iteration --- (#{key})" if debugLoopify

                # Step 1: reset the cache state
                bestCacheStash = $.cacheMask startPos, key
                # Step 2: set the cache to the last good result
                bestResult = item.base = result
                bestPos = item.endPos = $.code.pos
                $.cacheSet key, result:bestResult, endPos:bestPos
                # Step 3: reset the code state
                $.code.pos = startPos
                # Step 4: get the new result with above modifications
                result = fn.call this, $
                # Step 5: break when we found the best result
                $.log "[L] #{@name} break unless #{$.code.pos} > #{bestPos}" if debugLoopify
                break unless $.code.pos > bestPos

              # Tidy up state to best match
              # Step 1: reset the cache state again
              $.cacheMask startPos, key
              # Step 2: revert to best cache stash
              while bestCacheStash.length > 0
                {cacheKey,cacheValue} = bestCacheStash.pop()
                $.cacheSet cacheKey, cacheValue if cacheKey isnt key
              assert.ok $.cache[key] is undefined, "Cache value for self should have been cleared"
              # Step 3: set best code pos
              $.code.pos = bestPos
              $.log "[L] --- loop done --- (final result: #{escape bestResult})" if debugLoopify
              # Step 4: return best result, which will get cached
              delete $.recurse[key]
              return bestResult
          else
            throw new Error "Unexpected stage #{item.stage}"
        #finally
        #  delete $.recurse[key]
      when 1,2 # recursion detected
        item.stage = 2
        $.log "[L] recursion detected! (#{key})" if debugLoopify
        $.log "[L] returning null" if debugLoopify
        return null
      when 3 # loopified case
        throw new Error "This should not happen, cache should have hit (#{key})"
        #$.log "[L] returning #{item.base} (base case)" if debugLoopify
        #$.code.pos = item.endPos
        #return item.base
      else
        throw new Error "Unexpected stage #{item.stage} (B)"

  @$ruleCallback = (fn) -> ($) ->
    result = fn.call this, $
    result = @cb.call $, result if result isnt null and @cb?
    return result

  # for non-sequence rules with a label
  @$ruleLabel = (fn) -> ($) ->
    if this isnt @rule then return fn.call this, $
    result = fn.call this, $
    if result isnt null and @label? and @label not in ['@','&']
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
  deref: (name, excepts={}) ->
    assert.ok this is @rule, 'Only named nodes (rules) can dereference'
    return this if @name is name
    return @rules[name] if @rules?[name]?
    excepts[name] = yes
    for name, rule in @rules when not excepts[name]?
      derefed = rule.deref excepts
      return derefed if derefed?
    return @parent.deref name, excepts if @parent?
    return null
 
@Choice = Choice = clazz 'Choice', Node, ->
  init: (@choices) ->
    @children = @choices
  parse$: @$wrap ($) ->
    for choice in @choices
      result = $.try choice.parse
      if result isnt null
        if choice.label?
          result_ = {}
          result_[choice.label] = result
          return result_
        else
          return result
    return null
  toString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

@Rank = Rank = clazz 'Rank', Choice, ->

  @fromLines = (name, lines) ->
    rank = Rank name
    for line in lines
      if line instanceof OLine
        choice = line.toRule rank, index:rank.choices.length
        rank.addChoice choice
      else if line instanceof ILine
        for own name, rule of line.toRules()
          rank.include name, rule
      else
        throw new Error "Unknown line type, expected 'o' or 'i' line, got '#{line}' (#{typeof line})"
    rank

  init: (@name, @choices=[], includes={}) ->
    assert.ok @name, "Ranks should have a name, or be assigned one automatically"
    @rules = {}
    @children = []
    for choice, i in @choices
      @addChoice choice
    for name, rule of includes
      @include name, rule

  addChoice: (rule) ->
    @include rule.name, rule
    @choices.push rule

  include: (name, rule) ->
    assert.ok name?, "Rule needs a name: #{rule}"
    assert.ok not @rules[name]?, "Duplicate name #{name}"
    assert.ok rule instanceof Node, "Invalid rule with name #{name}"
    rule.name = name if not rule.name?
    @rules[name] = rule
    @children.push rule

  toString: -> blue("Rank(")+(@choices.map((c)->c.name).join blue(' | '))+blue(")")

@Sequence = Sequence = clazz 'Sequence', Node, ->
  init: (@sequence) ->
    @children = @sequence
  prepare: ->
    numCaptures = 0 # if the result should be an array
    numLabels = 0   # or, if the result should be an object
    for child in @children
      # Special!
      # Unlabeled Exists nodes get flattened out
      if child instanceof Exists
        if child.label?
          numLabels += 1
        else
          numCaptures += child.numCaptures
          numLabels += child.numLabels
      # Normal
      else
        numCaptures += 1 if child.capture
        numLabels += 1 if child.label?
    @type =
      if numLabels is 0
        if numCaptures > 1 then 'array' else 'single'
      else
        'object'
    # needed for flattening
    @numCaptures = numCaptures
    @numLabels = numLabels

  parse$: @$wrap ($) ->
    switch @type
      when 'array'
        results = []
        for child in @sequence
          res = child.parse $
          return null if res is null
          results.push res if child.capture
        return results
      when 'single'
        result = undefined
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
  init: ({@chars, @words, @lines}) ->
  parse$: @$wrap ($) ->
    $.code.peek chars:@chars, words:@words, lines:@lines
  toString: ->
    "<#{
      yellow @chars? and "chars:#{@chars}" or
             @words? and "words:#{@words}" or
             @lines? and "lines:#{@lines}"
    }>"

@Exists = Exists = clazz 'Exists', Node, ->
  init: (@it) ->
    @children = [@it]
  prepare: ->
    if @it.label?
      @numLabels = 1
    else if @it instanceof Sequence or @it instanceof Exists
      @numLabels = @it.numLabels
      @numCaptures = @it.numCaptures
    else
      @numLabels = 0
      @numCaptures = 1 if @it.capture
    @label = '@' if @numLabels > 0 and not @label?
    @capture = @numCaptures > 0
  parse$: @$wrap ($) ->
    res = $.try @it.parse
    return res ? undefined
  toString: -> ''+@it+blue("?")

@Pattern = Pattern = clazz 'Pattern', Node, ->
  init: ({@value, @join, @min, @max}) ->
    @children = if @join? then [@value, @join] else [@value]
    @capture = @value.capture
  parse$: @$wrap ($) ->
    matches = []
    result = $.try =>
      resV = @value.parse $
      if resV is null
        return null if @min? and @min > 0
        return []
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
    return result
  toString: ->
    "#{@value}#{cyan "*"}#{@join||''}#{cyan if @min? or @max? then "{#{@min||''},#{@max||''}}" else ''}"

@Not = Not = clazz 'Not', Node, ->
  capture: no
  init: (@it) ->
    @children = [@it]
  parse$: @$wrap ($) ->
    pos = $.code.pos
    res = @it.parse $
    $.code.pos = pos
    if res isnt null
      return null
    else
      return undefined
  toString: -> "#{yellow '!'}#{@it}"

@Ref = Ref = clazz 'Ref', Node, ->
  init: (@key) ->
    @capture = no if @key[0] is '_'
  parse$: @$wrap ($) ->
    node = $.grammar.rules[@key]
    throw Error "Unknown reference #{@key}" if not node?
    return node.parse $
  toString: -> red(@key)

@Str = Str = clazz 'Str', Node, ->
  capture: no
  init: (@str) ->
  parse$: @$wrap ($) -> $.code.match string:@str
  toString: -> green("'#{escape @str}'")

@Regex = Regex = clazz 'Regex', Node, ->
  init: (@reStr) ->
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '^'+@reStr
  parse$: @$wrap ($) -> $.code.match regex:@re
  toString: -> magenta(''+@re)

# Main external access.
# I dunno if Grammar should be a Node or not. It
# might come in handy when embedding grammars
# in some glue language.
@Grammar = Grammar = clazz 'Grammar', Node, ->
  init: (rules) ->
    rules = rules(MACROS) if typeof rules is 'function'
    @rank = Rank.fromLines "__grammar__", rules
    @rules = {}

    # Initial setup
    @rank.walk
      pre: (parent, node) =>
        if node.parent? and node isnt node.rule
          throw Error 'Grammar tree should be a DAG, nodes should not be referenced more than once.'
        # set node.parent, the immediate parent node
        node.parent = parent
        # set node.rule, the root node for this rule
        node.rule ||= parent?.rule
        # dereference all rules
        if node instanceof Rank
          assert.equal (inter = _.intersection _.keys(@rules), _.keys(node.rules)).length, 0, "Duplicate key(s): #{inter.join ','}"
          _.extend @rules, node.rules
      post: (parent, node) =>
        # call prepare on all nodes
        node.prepare()

  parse$: (code, {debug,returnContext}={}) ->
    debug ?= no
    returnContext ?= no
    code = CodeStream code if code not instanceof CodeStream
    $ = Context code, this, debug
    $.result = @rank.parse $
    throw Error "incomplete parse: [#{$.code.peek chars:50}]" if $.code.pos isnt $.code.text.length
    if returnContext
      return $
    else
      return $.result

Line = clazz 'Line', ->
  init: (@args...) ->
  # name: The final and correct name for this rule
  # rule: A rule-like object
  # parentRule: The actual parent Rule instance
  # options: {cb,...}
  getRule: (name, rule, parentRule, options) ->
    if typeof rule is 'string'
      rule = GRAMMAR.parse rule
    else if rule instanceof Array
      rule = Rank.fromLines name, rule
    else if rule instanceof OLine
      rule = rule.toRule parentRule, name:name
    assert.ok not rule.rule? or rule.rule is rule
    rule.rule = rule
    assert.ok not rule.name? or rule.name is name
    rule.name = name
    _.extend rule, options if options?
    rule
  # returns {rule:rule, options:{cb,disableCache,...}}
  getArgs: ->
    [rule, rest...] = @args
    result = rule:rule
    for next in rest
      if next instanceof Function
        (result.options||={}).cb = next
      else
        _.extend result.options||={}, next
    result

ILine = clazz 'ILine', Line, ->
  toRules: (parentRule) ->
    {rule, options} = @getArgs()
    rules = {}
    # for an ILine, rule is an object of {"NAME":rule}
    for own name, _rule of rule
      rules[name] = @getRule name, _rule, parentRule, options
    rules

OLine = clazz 'OLine', Line, ->
  toRule: (parentRule, {index,name}) ->
    {rule, options} = @getArgs()
    # figure out the name for this rule
    if not name and
      typeof rule isnt 'string' and
      rule not instanceof Array and
      rule not instanceof Node
        # NAME: rule
        assert.ok _.keys(rule).length is 1, "Named rule should only have one key-value pair"
        name = _.keys(rule)[0]
        rule = rule[name]
    else if not name? and index? and parentRule?
      name = parentRule.name + "[#{index}]"
    else if not name?
      throw new Error "Name undefined for 'o' line"
    rule = @getRule name, rule, parentRule, options
    rule.parent = parentRule
    rule.index = index
    rule

@MACROS = MACROS =
  # Any rule node, possibly part of a Rank node
  o: OLine
  # Include line... Not included in the Rank order
  i: ILine
  # Helper for declaring tokens
  tokens: (tokens...) ->
    cb = tokens.pop() if typeof tokens[tokens.length-1] is 'function'
    rank = Rank "__tokens_temp__"
    for token in tokens
      name = '_'+token.toUpperCase()
      rule = GRAMMAR.parse "_ &:'#{token}' <chars:1> !/[a-zA-Z\\$_0-9]/"
      rule.cb = cb if cb?
      rank.choices.push rule
      rank.include name, rule
    delete rank.name
    # TODO make sure caching is working correctly
    # TODO try to prune debug lines
    OLine rank

C  = -> Choice (x for x in arguments)
E  = -> Exists arguments...
L  = (label, node) -> node.label = label; node
La = -> Lookahead arguments...
N  = -> Not arguments...
P  = (value, join, min, max) -> Pattern value:value, join:join, min:min, max:max
R  = -> Ref arguments...
Re = -> Regex arguments...
S  = -> Sequence (x for x in arguments)
St = -> Str arguments...
{o, i, tokens}  = MACROS

@GRAMMAR = GRAMMAR = Grammar [
  o EXPR: [
    o S(R("CHOICE"), R("_"))
    o "CHOICE": [
      o S(P(R("_PIPE")), P(R("SEQUENCE"),R("_PIPE"),2), P(R("_PIPE"))), Choice
      o "SEQUENCE": [
        o P(R("UNIT"),null,2), Sequence
        o "UNIT": [
          o S(R("_"), R("LABELED"))
          o "LABELED": [
            o S(E(S(L("label",R("LABEL")), St(':'))), L('&',C(R("COMMAND"),R("DECORATED"),R("PRIMARY"))))
            o "COMMAND": [
              o S(St('<chars:'), L("chars",R("INT")), St('>')), Lookahead
              o S(St('<words:'), L("words",R("INT")), St('>')), Lookahead
            ]
            o "DECORATED": [
              o S(R("PRIMARY"), St('?')), Exists
              o S(L("value",R("PRIMARY")), St('*'), L("join",E(S(N(R("__")), R("PRIMARY")))), L("@",E(R("RANGE")))), Pattern
              o S(L("value",R("PRIMARY")), L("@",R("RANGE"))), Pattern
              o S(St('!'), R("PRIMARY")), Not
              i "RANGE": o S(St('{'), R("_"), L("min",E(R("INT"))), R("_"), St(','), R("_"), L("max",E(R("INT"))), R("_"), St('}'))
            ]
            o "PRIMARY": [
              o R("WORD"), Ref
              o S(St('('), R("EXPR"), St(')'))
              o S(St("'"), P(S(N(St("'")), C(R("ESC1"), R(".")))), St("'")), (it) -> Str it.join ''
              o S(St("/"), P(S(N(St("/")), C(R("ESC2"), R(".")))), St("/")), (it) -> Regex it.join ''
            ]
          ]
        ]
      ]
    ]
  ]
  i
    # tokens
    LABEL:              o C(St('&'), St('@'), R("WORD"))
    WORD:               o S(La(words:1), Re("[a-zA-Z\\._][a-zA-Z\\._0-9]*"))
    INT:                o S(La(words:1), Re("[0-9]+")), Number
    _PIPE:              o S(R("_"), St('|'))
    # whitespaces
    _:                  o S(La(words:1), Re("[ \\n]*"))
    __:                 o S(La(words:1), Re("[ \\n]+"))
    # other
    '.':                o S(La(chars:1), Re("[\\s\\S]"))
    ESC1:               o S(St('\\'), R("."))
    ESC2:               o S(St('\\'), R(".")), (chr) -> '\\'+chr
]

