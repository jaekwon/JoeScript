###
JoeSon Parser
Jae Kwon 2012
###

_ = require 'underscore'
assert = require 'assert'
{inspect, CodeStream} = require './codestream'
{clazz} = require 'cardamom'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require 'joeson/lib/colors'

escape = (str) ->
  (''+str).replace(/\\/g, '\\\\').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/'/g, "\\'")
keystr = (key) -> "#{key.pos},#{key.name}"
debugLoopify = debugCache = no

# aka '$' in parse functions
@ParseContext = ParseContext = clazz 'ParseContext', ->

  # code:     CodeStream instance
  # grammar:  Grammar instance
  # debug:    yes to print parse log
  # options:  Parse-time options, accessible from grammar callback functions
  init: ({@code, @grammar, @debug, @options}={}) ->
    @debug ?= false
    @stack = []         # [ {name,pos,...}... ]
    @cache = {}         # { pos:{ "#{name}":{result,endPos}... } }
    @cacheStores = []   # [ {name,pos}... ]
    @recurse = {}       # { pos:{ "#{name}":{stage,base,endPos}... } }
    @_ctr = 0

  # code.pos will be reverted if result is null
  try: (fn) ->
    pos = @code.pos
    result = fn(this)
    @code.pos = pos if result is null
    result

  log: (message, count=false) ->
    if @debug and not @skipLog
      if count
        console.log "#{++@_ctr}\t#{cyan Array(@stack.length-1).join '| '}#{message}"
      else
        console.log "#{@_ctr}\t#{cyan Array(@stack.length-1).join '| '}#{message}"

  cacheSet: (key, value) ->
    if not @cache[key.pos]?[key.name]?
      (@cache[key.pos]||={})[key.name] = value
      @cacheStores.push key
    else
      throw new Error "Cache store error @ $.cache[#{keystr key}]: existing entry"

  cacheMask: (pos, stopName) ->
    stash = []
    for i in [@cacheStores.length-1..0] by -1
      cacheKey = @cacheStores[i]
      continue if cacheKey.pos isnt pos
      cacheValue = @cache[cacheKey.pos][cacheKey.name]
      delete @cache[cacheKey.pos][cacheKey.name]
      stash.push {cacheKey, cacheValue}
      break if cacheKey.name is stopName
    stash

  # key: {name,pos}
  cacheDelete: (key) ->
    assert.ok @cache[key.pos]?[key.name]?, "Cannot delete missing cache item at key #{keystr key}"
    cacheStoresIdx = undefined
    for i in [@cacheStores.length-1..0] by -1
      cKey = @cacheStores[i]
      if cKey.pos is key.pos and cKey.name is key.name
        cacheStoresIdx = i
        break
    assert.ok cacheStoresIdx, "cacheStores[] is missing an entry for #{keystr key}"
    delete @cache[key.pos][key.name]
    @cacheStores.splice cacheStoresIdx, 1

###
  In addition to the attributes defined by subclasses,
    the following attributes exist for all nodes.
  node.rule = The topmost node of a rule.
  node.rule = rule # sometimes true.
  node.name = name of the rule, if this is @rule.
###
@GNode = GNode = clazz 'GNode', ->

  @optionKeys = ['skipLog', 'skipCache', 'cb']

  @$stack = (fn) -> ($) ->
    return fn.call this, $ if this isnt @rule
    stackItem = name:@name, pos:$.code.pos
    $.stack.push stackItem
    result = fn.call this, $
    popped = $.stack.pop()
    assert.ok stackItem is popped
    return result

  @$debug = (fn) -> ($) ->
    return fn.call this, $ if this isnt @rule or not $.debug or $.skipLog
    $.skipLog = yes if @skipLog
    bufferStr = escape $.code.peek chars:20
    bufferStr = if bufferStr.length < 20 then '['+bufferStr+']' else '['+bufferStr+'>'
    $.log "#{red @name}: #{blue this} #{black bufferStr}", true
    result = fn.call this, $
    $.log "^-- #{escape result} #{black typeof result}", true if result isnt null
    delete $.skipLog
    return result

  @$cache = (fn) -> ($) ->
    return fn.call this, $ if this isnt @rule or @skipCache
    key = name:@name, pos:$.code.pos
    if (cached=$.cache[key.pos]?[key.name])?
      $.log "[C] Cache hit @ $.cache[#{keystr key}]: #{escape cached.result}" if debugCache
      $.code.pos = cached.endPos
      return cached.result
    result = fn.call this, $
    if not $.cache[key.pos]?[key.name]?
      $.log "[C] Cache store @ $.cache[#{keystr key}]: #{escape result}" if debugCache
      $.cacheSet key, result:result, endPos:$.code.pos
    else
      throw new Error "Cache store error @ $.cache[#{keystr key}]: existing entry"
    return result

  @$loopify = (fn) -> ($) ->
    return fn.call this, $ if this isnt @rule
    key = name:@name, pos:$.code.pos
    item = ($.recurse[key.pos]||={})[key.name] ||= stage:0

    switch item.stage
      when 0 # non-recursive (so far)
        item.stage = 1
        startPos = $.code.pos
        startCacheLength = $.cacheStores.length
        result = fn.call this, $
        #try
        switch item.stage
          when 1 # non-recursive (done)
            delete $.recurse[key.pos][key.name]
            return result
          when 2 # recursion detected
            if result is null
              $.log "[L] returning #{escape result} (no result)" if debugLoopify
              $.cacheDelete key
              delete $.recurse[key.pos][key.name]
              return result
            else
              $.log "[L] --- loop start --- (#{keystr key}) (initial result was #{escape result})" if debugLoopify
              item.stage = 3
              while result isnt null
                $.log "[L] --- loop iteration --- (#{keystr key})" if debugLoopify

                # Step 1: reset the cache state
                bestCacheStash = $.cacheMask startPos, @name
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
              $.cacheMask startPos, @name
              # Step 2: revert to best cache stash
              while bestCacheStash.length > 0
                {cacheKey,cacheValue} = bestCacheStash.pop()
                $.cacheSet cacheKey, cacheValue if not (cacheKey.name is key.name and cacheKey.pos is key.pos)
              assert.ok $.cache[key.pos]?[key.name] is undefined, "Cache value for self should have been cleared"
              # Step 3: set best code pos
              $.code.pos = bestPos
              $.log "[L] --- loop done --- (final result: #{escape bestResult})" if debugLoopify
              # Step 4: return best result, which will get cached
              delete $.recurse[key.pos][key.name]
              return bestResult
          else
            throw new Error "Unexpected stage #{item.stage}"
        #finally
        #  delete $.recurse[key.pos][key.name]
      when 1,2 # recursion detected
        item.stage = 2
        $.log "[L] recursion detected! (#{keystr key})" if debugLoopify
        $.log "[L] returning null" if debugLoopify
        return null
      when 3 # loopified case
        throw new Error "This should not happen, cache should have hit (#{keystr key})"
        #$.log "[L] returning #{item.base} (base case)" if debugLoopify
        #$.code.pos = item.endPos
        #return item.base
      else
        throw new Error "Unexpected stage #{item.stage} (B)"

  @$prepareResult = (fn) -> ($) ->
    result = fn.call this, $
    if result isnt null
      # handle labels for standalone nodes
      if @label? and not @parent?.handlesChildLabel
        # syntax proposal:
        # result = ( it <- (it={})[@label] = result )
        result = ( (it={})[@label] = result; it )
      result = @cb.call result, result, $ if @cb?
    return result

  @$wrap = (fn) ->
    @$stack @$debug @$cache @$loopify @$prepareResult fn

  capture: yes
  walk: ({pre, post}, parent=undefined) ->
    # pre, post: (parent, childNode) -> where childNode in parent.children.
    pre parent, @ if pre?
    if @children
      for child in @children
        if child not instanceof GNode
          throw Error "Unexpected object encountered walking children: #{child}"
        child.walk {pre:pre, post:post}, @
    post parent, @ if post?
  prepare: -> # implement if needed
  toString: -> "[#{@constructor.name}]"
  include: (name, rule) ->
    @rules ||= {}
    assert.ok name?, "Rule needs a name: #{rule}"
    assert.ok rule instanceof GNode, "Invalid rule with name #{name}: #{rule} (#{rule.constructor.name})"
    assert.ok not @rules[name]?, "Duplicate name #{name}"
    rule.name = name if not rule.name?
    @rules[name] = rule
    @children.push rule
  # NOT USED (YET?)
  deref: (name, excepts={}) ->
    return this if @name is name
    return @rules[name] if @rules?[name]?
    excepts[name] = yes
    for name, rule in @rules when not excepts[name]?
      derefed = rule.deref excepts
      return derefed if derefed?
    return @parent.deref name, excepts if @parent?
    return null
  # find a parent in the ancestry chain that satisfies condition
  findParent: (condition) ->
    parent = @parent
    loop
      return parent if condition parent
      parent = parent.parent

@Choice = Choice = clazz 'Choice', GNode, ->

  init: (@choices) ->
    @children = @choices

  prepare: ->
    @capture = _.all @choices, (choice)->choice.capture

  parse$: @$wrap ($) ->
    for choice in @choices
      result = $.try choice.parse
      if result isnt null
        return result
    return null

  toString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

@Rank = Rank = clazz 'Rank', Choice, ->

  @fromLines = (name, lines) ->
    rank = Rank name
    for line, idx in lines
      if line instanceof OLine
        choice = line.toRule rank, index:rank.choices.length
        rank.addChoice choice
      else if line instanceof ILine
        for own name, rule of line.toRules()
          rank.include name, rule
      else if line instanceof Object and idx is lines.length-1
        assert.ok (_.intersection GNode.optionKeys, _.keys(line)).length > 0,
          "Invalid options? #{line.constructor.name}"
        _.extend rank, line
      else
        throw new Error "Unknown line type, expected 'o' or 'i' line, got '#{line}' (#{typeof line})"
    rank

  init: (@name, @choices=[], includes={}) ->
    @rules = {}
    @children = []
    for choice, i in @choices
      @addChoice choice
    for name, rule of includes
      @include name, rule

  addChoice: (rule) ->
    @include rule.name, rule
    @choices.push rule

  toString: -> blue("Rank(")+(@choices.map((c)->c.name).join blue(' | '))+blue(")")

@Sequence = Sequence = clazz 'Sequence', GNode, ->
  handlesChildLabel: yes

  init: (@sequence) ->
    @children = @sequence

  labels$: get: ->
    labels = []
    for child in @children
      if child instanceof Existential
        if child.label
          labels.push child.label
        else
          _.extend labels, child.labels
      else
        labels.push child.label if child.label
    @labels = labels

  captures$: get: ->
    captures = []
    for child in @children
      if child instanceof Existential
        if not child.label
          captures.push child.captures if child.capture
      else
        captures.push child if child.capture
    @captures = captures

  type$: get: ->
    if @labels.length is 0
      if @captures.length > 1 then 'array' else 'single'
    else
      'object'

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
        results[label] = undefined for label in @labels
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
      else
        throw new Error "Unexpected type #{@type}"
    throw new Error

  toString: ->
    labeledStrs = for node in @sequence
      if node.label?
        "#{cyan node.label}#{blue ':'}#{node}"
      else
        ''+node
    blue("(")+(labeledStrs.join ' ')+blue(")")

@Peek = Peek = clazz 'Peek', GNode, ->
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

@Lookahead = Lookahead = clazz 'Lookahead', GNode, ->
  capture: no
  init: ({@expr}) ->
    @children = [@expr]
  parse$: @$wrap ($) ->
    pos = $.code.pos
    result = @expr.parse $
    $.code.pos = pos
    result
  toString: -> "#{blue "(?"}#{@expr}#{blue ")"}"

@Existential = Existential = clazz 'Existential', GNode, ->
  handlesChildLabel$: get: -> @parent?.handlesChildLabel

  init: (@it) ->
    @children = [@it]

  labels$: get: -> @it.labels
  captures$: get: -> @it.captures

  prepare: ->
    @label   ?= '@' if @labels?.length > 0
    @capture ?= @captures?.length > 0

  parse$: @$wrap ($) ->
    res = $.try @it.parse
    return res ? undefined

  toString: -> ''+@it+blue("?")

@Pattern = Pattern = clazz 'Pattern', GNode, ->
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

@Not = Not = clazz 'Not', GNode, ->
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

@Ref = Ref = clazz 'Ref', GNode, ->
  # note: @ref because @name is reserved.
  init: (@ref) ->
    @capture = no if @ref[0] is '_'
  parse$: @$wrap ($) ->
    node = $.grammar.rules[@ref]
    throw Error "Unknown reference #{@ref}" if not node?
    return node.parse $
  toString: -> red(@ref)

@Str = Str = clazz 'Str', GNode, ->
  capture: no
  init: (@str) ->
  parse$: @$wrap ($) -> $.code.match string:@str
  toString: -> green("'#{escape @str}'")

@Regex = Regex = clazz 'Regex', GNode, ->
  init: (@reStr) ->
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '^'+@reStr
  parse$: @$wrap ($) -> $.code.match regex:@re
  toString: -> magenta(''+@re)

# Main external access.
# I dunno if Grammar should be a GNode or not. It
# might come in handy when embedding grammars
# in some glue language.
@Grammar = Grammar = clazz 'Grammar', GNode, ->

  # Temporary convenience function for loading a Joescript file with
  # a single GRAMMAR = ... definition, for parser generation.
  # A proper joescript environment should give access of
  # block ASTs to the runtime, thereby making this compilation step
  # unnecessary.
  @fromFile = (filename) ->
    joe = require('joeson/src/joescript')
    chars = require('fs').readFileSync filename, 'utf8'
    try
      fileAST = joe.parse chars
    catch error
      console.log "Joeson couldn't parse #{filename}. Parse log..."
      joe.parse chars, debug:yes
      throw error
    joeNodes = joe.NODES
    assert.ok fileAST instanceof joe.NODES.Block

    # Find GRAMMAR = ...
    grammarAssign = _.find fileAST.lines, (line) ->
      line instanceof joe.NODES.Assign and
        ''+line.target is 'GRAMMAR' and
        line.type is '='
    grammarAST = grammarAssign.value

    # Compile an AST node
    # Func GNodes (->) become Arrays
    #  (unless it's a non-first parameter to an Invocation, a callback function)
    # Str, Obj, Arr, and Invocations become interpreted directly
    compileAST = (node) ->
      switch node.constructor
        when joe.NODES.Func
          assert.ok node.params is undefined, "Rank function should accept no parameters"
          assert.ok node.type is '->', "Rank function should be ->, not #{node.type}"
          return node.block.lines.map( (item)->compileAST item ).filter (x)->x?
        when joe.NODES.Word
          # words *should* be function references. Pass the AST on.
          return node
        when joe.NODES.Invocation
          func = MACROS[''+node.func]
          assert.ok func?, "Function #{node.func.name} not in MACROS"
          params = node.params.map (p) ->
            # Func nodes that are direct invocation parameters do not
            # get interpreted, they are callback functions
            # & joeson rules need them as ASTs for parser generation.
            if p instanceof joe.NODES.Func then p else compileAST p
          return func.apply null, params
        when joe.NODES.Str
          return node.parts.join ''
        when joe.NODES.Arr
          return node.items.map (item) -> compileAST item
        when joe.NODES.Obj
          obj = {}
          for item in node.items
            if ''+item.key in ['cb'] # pass the AST thru.
              obj[compileAST item.key] = item.value
            else
              obj[compileAST item.key] = compileAST item.value
          return obj
        when joe.NODES.Heredoc
          return null
        else
          throw new Error "Unexpected node type #{node.constructor.name}"

    compiledAST = compileAST grammarAST
    return Grammar compiledAST

  init: (rank) ->
    rank = rank(MACROS) if typeof rank is 'function'
    @rank = Rank.fromLines "__grammar__", rank if rank instanceof Array
    @rules = {}

    # Initial setup
    @rank.walk
      pre: (parent, node) =>
        if node.parent? and node isnt node.rule
          throw Error 'Grammar tree should be a DAG, nodes should not be referenced more than once.'
        # set node.parent, the immediate parent node
        node.parent = parent
        # set node.rule, the root node for this rule
        if not node.inlineLabel?
          node.rule ||= parent?.rule
        else
          # inline rules are special
          node.rule = node
          parent.rule.include node.inlineLabel, node
      post: (parent, node) =>
        # dereference all rules
        if node.rules?
          assert.equal (inter = _.intersection _.keys(@rules), _.keys(node.rules)).length, 0, "Duplicate key(s): #{inter.join ','}"
          _.extend @rules, node.rules
        # call prepare on all nodes
        node.prepare()

  parse$: (code, {debug,returnContext,options}={}) ->
    debug ?= no
    returnContext ?= no
    code = CodeStream code if code not instanceof CodeStream
    $ = ParseContext code:code, grammar:this, debug:debug, options:options
    $.result = @rank.parse $
    throw Error "Incomplete parse: '#{escape $.code.peek chars:50}'" if $.code.pos isnt $.code.text.length
    if returnContext
      return $
    else
      return $.result

  compile: () ->
    joe = require('joeson/src/joescript').NODES
    code = undefined # TODO
    require('./translators/javascript').translate code

Line = clazz 'Line', ->
  init: (@args...) ->
  # name: The final and correct name for this rule
  # rule: A rule-like object
  # parentRule: The actual parent Rule instance
  # options: {cb,...}
  getRule: (name, rule, parentRule, options) ->
    if typeof rule is 'string'
      try
        rule = GRAMMAR.parse rule
      catch err
        console.log "Error in rule #{name}: #{rule}"
        GRAMMAR.parse rule, debug:yes
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
  # returns {rule:rule, options:{cb,skipCache,skipLog,...}}
  getArgs: ->
    [rule, rest...] = @args
    result = rule:rule, options:{}
    for own key, value of rule
      if key in GNode.optionKeys
        result.options[key] = value
        delete rule[key]
    for next in rest
      if next instanceof Function
        result.options.cb = next
      else if next instanceof Object and next.constructor.name is 'Func'
        result.options.cbAST = next
      else if next instanceof Object and next.constructor.name is 'Word'
        result.options.cbName = next
      else
        _.extend result.options, next
    result
  toString: ->
    "#{@type} #{@args.join ','}"

ILine = clazz 'ILine', Line, ->
  type: 'i'
  toRules: (parentRule) ->
    {rule, options} = @getArgs()
    rules = {}
    # for an ILine, rule is an object of {"NAME":rule}
    for own name, _rule of rule
      rules[name] = @getRule name, _rule, parentRule, options
    rules

OLine = clazz 'OLine', Line, ->
  type: 'o'
  toRule: (parentRule, {index,name}) ->
    {rule, options} = @getArgs()
    # figure out the name for this rule
    if not name and
      typeof rule isnt 'string' and
      rule not instanceof Array and
      rule not instanceof GNode
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
    rank = Rank()
    for token in tokens
      name = '_'+token.toUpperCase()
      rule = GRAMMAR.parse "_ &:'#{token}' <chars:1> !/[a-zA-Z\\$_0-9]/"
      rule.skipLog = yes
      rule.skipCache = yes
      rule.cb = cb if cb?
      rank.choices.push rule
      rank.include name, rule
    OLine rank

C  = -> Choice (x for x in arguments)
E  = -> Existential arguments...
L  = (label, node) -> node.label = label; node
Pk = -> Peek arguments...
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
              o S(St('<chars:'), L("chars",R("INT")), St('>')), Peek
              o S(St('<words:'), L("words",R("INT")), St('>')), Peek
            ]
            o "DECORATED": [
              o S(R("PRIMARY"), St('?')), Existential
              o S(L("value",R("PRIMARY")), St('*'), L("join",E(S(N(R("__")), R("PRIMARY")))), L("@",E(R("RANGE")))), Pattern
              o S(L("value",R("PRIMARY")), St('+'), L("join",E(S(N(R("__")), R("PRIMARY"))))), ({value,join}) -> Pattern value:value, join:join, min:1
              o S(L("value",R("PRIMARY")), L("@",R("RANGE"))), Pattern
              o S(St('!'), R("PRIMARY")), Not
              o C(S(St('(?'), L("expr",R("EXPR")), St(')')), S(St('?'), L("expr",R("EXPR")))), Lookahead
              i "RANGE": o S(St('{'), R("_"), L("min",E(R("INT"))), R("_"), St(','), R("_"), L("max",E(R("INT"))), R("_"), St('}'))
            ]
            o "PRIMARY": [
              o R("WORD"), Ref
              o S(St('('), L("inlineLabel",E(S(R('WORD'), St(': ')))), L("&",R("EXPR")), St(')'), E(S(R('_'), St('->'), R('_'), L("code",R("CODE")))))
              i "CODE": o S(St("{"), P(S(N(St("}")), C(R("ESC1"), R(".")))), St("}")), (it) -> it.join ''
              o S(St("'"), P(S(N(St("'")), C(R("ESC1"), R(".")))), St("'")), (it) -> Str       it.join ''
              o S(St("/"), P(S(N(St("/")), C(R("ESC2"), R(".")))), St("/")), (it) -> Regex     it.join ''
              o S(St("["), P(S(N(St("]")), C(R("ESC2"), R(".")))), St("]")), (it) -> Regex "[#{it.join ''}]"
            ]
          ]
        ]
      ]
    ]
  ]
  i LABEL:    C(St('&'), St('@'), R("WORD"))
  i WORD:     S(Pk(words:1), Re("[a-zA-Z\\._][a-zA-Z\\._0-9]*"))
  i INT:      S(Pk(words:1), Re("[0-9]+")), Number
  i _PIPE:    S(R("_"), St('|'))
  i _:        P(C(St(' '), St('\n')))
  i __:       P(C(St(' '), St('\n')), null, 1)
  i '.':      S(Pk(chars:1), Re("[\\s\\S]"))
  i ESC1:     S(St('\\'), R("."))
  i ESC2:     S(St('\\'), R(".")), (chr) -> '\\'+chr
]
