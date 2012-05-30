###
JoeSon Parser
Jae Kwon 2012
###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
{CodeStream} = require 'joeson/src/codestream'
{escape} = require 'joeson/lib/helpers'

trace =
  stack:     no
  loop:      yes
  skipSetup: yes

_stk = [] # trace stack

# Frames stack up during parsing
@Frame = Frame = clazz 'Frame', ->
  init: ({@result, @pos, @endPos, @id, @loopStage, @wipemask}) ->
  cacheSet: (@result, @endPos) ->
  toString: -> "[F|result:#{@result} #{yellow @id}@#{blue @pos}...#{blue @endPos ? ''} lS:#{@loopStage or '_'} m:#{@wipemask?}]"

# aka '$' in parse functions
@ParseContext = ParseContext = clazz 'ParseContext', ->

  # code:       CodeStream instance
  # grammar:    Grammar instance
  # env:        Parse-time env, accessible from grammar callback functions
  init: ({@code, @grammar, @env}={}) ->
    @stack = new Array(1024)
    @stackLength = 0
    # { pos:{ (node.id):{id,result,pos,endPos,stage,...(same object as in stack)}... } }
    @frames = (new Array(@grammar.numRules) for i in [0...@code.text.length+1]) # include EOF
    @counter = 0

  # code.pos will be reverted if result is null
  try: (fn) ->
    pos = @code.pos
    result = fn(this)
    @code.pos = pos if result is null
    result

  log: (message) ->
    unless @skipLog
      console.log "#{@counter}\t#{cyan Array(@stackLength+1).join '| '}#{message}"

  stackPush: (node) -> @stack[@stackLength++] = @getFrame(node)
  stackPop: (node) -> --@stackLength

  getFrame: (node) ->
    id = node.id
    pos = @code.pos
    posFrames = @frames[pos]
    if not (frame=posFrames[id])?
      return posFrames[id] = new Frame(pos:pos, id:id)
    else return frame

  wipeWith: (frame, makeStash=yes) ->
    assert.ok frame.wipemask?, "Need frame.wipemask to know what to wipe"
    stash = new Array(@grammar.numRules) if makeStash
    stashCount = 0
    pos = frame.pos
    posFrames = @frames[pos]
    for wipe, i in frame.wipemask when wipe
      stash[i] = posFrames[i] if makeStash
      #console.log "wipe", i, ">", wipe, ">", posFrames[i]
      posFrames[i] = undefined
      stashCount++
    stash?.count = stashCount
    return stash

  restoreWith: (stash) ->
    stashCount = stash.count
    for frame, i in stash when frame
      pos       ?= frame.pos
      posFrames ?= @frames[pos]
      posFrames[i] = frame
      stashCount--
      break if stashCount is 0

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
    $.stackPush this
    result = fn.call this, $
    $.stackPop this
    return result

  @$loopify = (fn) -> ($) ->
    return fn.call this, $ if this isnt @rule

    # STACK TRACE
    if trace.stack
      bufferStr = "#{ black "["
                  }#{ black escape $.code.peek afterChars:20
                  }#{ if $.code.pos+20 < $.code.text.length
                        black '>'
                      else
                        black ']'}"
      $.log "x #{this} #{bufferStr}"

    if @skipCache
      result = fn.call this, $
      $.log "#{cyan "`->"} #{escape result} #{black typeof result}" if trace.stack
      return result

    frame = $.getFrame this
    pos = startPos = $.code.pos
    key = "#{@name}@#{pos}"

    switch frame.loopStage
      when 0, undefined # non-recursive (so far)

        # The only time a cache hit will simply return is when loopStage is 0
        if frame.endPos?
          $.log "#{cyan "`- HIT >"} #{escape frame.result} #{black typeof frame.result}" if trace.stack
          $.code.pos = frame.endPos
          return frame.result

        #start = new Date()
        #timez = []
        frame.loopStage = 1
        frame.cacheSet null
        result = fn.call this, $

        switch frame.loopStage
          when 1 # non-recursive (done)
            frame.loopStage = 0
            frame.cacheSet result, $.code.pos
            $.log "#{cyan "`- CS >"} #{escape result} #{black typeof result}" if trace.stack
            return result

          when 2 # recursion detected by subroutine above
            if result is null
              $.log "#{yellow "`--- loop null ---"} " if trace.stack
              frame.loopStage = 0
              #frame.cacheSet null # already null
              return result
            else
              frame.loopStage = 3
              if trace.loop
                _stk.push(@name)
                line = $.code.line
                console.log  "#{ (switch line%6
                                    when 0 then blue
                                    when 1 then cyan
                                    when 2 then white
                                    when 3 then yellow
                                    when 4 then red
                                    when 5 then magenta)('@'+line)
                           }\t#{ red (frame.id for frame in $.stack[...$.stackLength])
                          } - #{ _stk
                          } - #{ yellow escape result
                           }: #{ blue escape $.code.peek beforeChars:10, afterChars:10 }"
              while result isnt null
                #timez.push (end = new Date()).valueOf() - start.valueOf()
                #start = end

                assert.ok frame.wipemask?, "where's my wipemask"
                bestStash = $.wipeWith frame, yes
                bestResult = result
                bestEndPos = $.code.pos
                frame.cacheSet bestResult, bestEndPos
                $.log "#{yellow "|`--- loop iteration ---"} #{frame}" if trace.stack
                $.code.pos = startPos
                result = fn.call this, $
                break unless $.code.pos > bestEndPos

              if trace.loop
                _stk.pop()

              $.wipeWith frame, no
              $.restoreWith bestStash
              $.code.pos = bestEndPos
              $.log "#{yellow "`--- loop done! ---"} best result: #{escape bestResult}" if trace.stack
              # Step 4: return best result, which will get cached
              frame.loopStage = 0
              return bestResult

          else throw new Error "Unexpected stage #{stages[pos]}"

      when 1,2,3
        if frame.loopStage = 1
          frame.loopStage = 2 # recursion detected

        # Step 1: Collect wipemask so we can wipe the frames later.
        $.log "#{yellow "`- base ->"} #{escape frame.result} #{black typeof frame.result}" if trace.stack
        frame.wipemask ?= new Array($.grammar.numRules)
        for i in [$.stackLength-2..0] by -1
          i_frame = $.stack[i]
          assert.ok i_frame.pos <= startPos
          break if i_frame.pos < startPos
          break if i_frame.id is @id
          frame.wipemask[i_frame.id] = yes

        # Step 2: Return whatever was cacheSet.
        $.code.pos = frame.endPos if frame.endPos?
        return frame.result

      else throw new Error "Unexpected stage #{stage} (B)"

  @$prepareResult = (fn) -> ($) ->
    $.counter++
    result = fn.call this, $
    if result isnt null
      # handle labels for standalone nodes
      if @label? and not @parent?.handlesChildLabel
        # syntax proposal:
        # result = ( it <- (it={})[@label] = result )
        result = ( (it={})[@label] = result; it )
      result = @cb.call this, result, $ if @cb?
    return result

  @$wrap = (fn) ->
    @$stack @$loopify @$prepareResult fn

  walk: ({pre, post}, parent=undefined) ->
    # pre, post: (parent, childNode) -> where childNode in parent.children.
    pre parent, @ if pre?
    if @children
      for child in @children
        if child not instanceof GNode
          throw Error "Unexpected object encountered walking children: #{child}"
        child.walk {pre:pre, post:post}, @
    post parent, @ if post?

  capture:   yes
  labels$:   get: -> @_labels ?= (if @label then [@label] else [])
  captures$: get: -> @_captures ?= (if @capture then [this] else [])

  # called after all its children have been prepared.
  # don't put logic in here, too easy to forget to call super.
  prepare: ->

  toString: ->
    "#{ if this is @rule
          red(@name+': ')
        else if @label?
          cyan(@label+':')
        else ''
    }#{ @contentString() }"

  include: (name, rule) ->
    @rules ?= {}
    @children ?= []
    #assert.ok name?, "Rule needs a name: #{rule}"
    #assert.ok rule instanceof GNode, "Invalid rule with name #{name}: #{rule} (#{rule.constructor.name})"
    #assert.ok not @rules[name]?, "Duplicate name #{name}"
    rule.name = name if not rule.name?
    @rules[name] = rule
    @children.push rule

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

  contentString: -> blue("(")+(@choices.join blue(' | '))+blue(")")

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

  contentString: -> blue("Rank(")+(@choices.map((c)->red(c.name)).join blue(' | '))+blue(")")

@Sequence = Sequence = clazz 'Sequence', GNode, ->
  handlesChildLabel: yes

  init: (@sequence) ->
    @children = @sequence

  labels$: get: -> @_labels ?= (if @label? then [@label] else _.flatten (child.labels for child in @children))
  captures$: get: -> @_captures ?= (_.flatten (child.captures for child in @children))

  type$: get: ->
    @_type?=(
      if @labels.length is 0
        if @captures.length > 1 then 'array' else 'single'
      else
        'object'
    )

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
        # results[label] = undefined for label in @labels
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

  contentString: ->
    labeledStrs = for node in @sequence
      ''+node
    blue("(")+(labeledStrs.join ' ')+blue(")")

@Lookahead = Lookahead = clazz 'Lookahead', GNode, ->
  capture: no
  init: ({@expr}) ->
    @children = [@expr]
  parse$: @$wrap ($) ->
    pos = $.code.pos
    result = @expr.parse $
    $.code.pos = pos
    result
  contentString: -> "#{blue "(?"}#{@expr}#{blue ")"}"

@Existential = Existential = clazz 'Existential', GNode, ->
  handlesChildLabel$: get: -> @parent?.handlesChildLabel

  init: (@it) -> @children = [@it]

  prepare: ->
    labels   = if @label? and @label not in ['@','&'] then [@label] else @it.labels
    @label   ?= '@' if labels.length > 0
    captures  = @it.captures
    @capture  = captures?.length > 0
    # some strangeness in overwritting getter funcs...
    # they don't become available right away. wtf?
    @labels   = labels
    @captures = captures

  parse$: @$wrap ($) ->
    res = $.try @it.parse
    return res ? undefined

  contentString: -> '' + @it + blue("?")

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
  contentString: ->
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
  contentString: -> "#{yellow '!'}#{@it}"

@Ref = Ref = clazz 'Ref', GNode, ->
  # note: @ref because @name is reserved.
  init: (@ref) ->
    @capture = no if @ref[0] is '_'

  labels$: get: ->
    @_labels ?=
      if @label is '@' then @grammar.rules[@ref].labels
      else if @label   then [@label]
      else                  []
  
  parse$: @$wrap ($) ->
    node = @grammar.rules[@ref]
    throw Error "Unknown reference #{@ref}" if not node?
    return node.parse $

  contentString: -> red(@ref)

@Str = Str = clazz 'Str', GNode, ->
  capture: no
  init: (@str) ->
  parse$: @$wrap ($) -> $.code.match string:@str
  contentString: -> green("'#{escape @str}'")

@Regex = Regex = clazz 'Regex', GNode, ->
  init: (@reStr) ->
    if typeof @reStr isnt 'string'
      throw Error "Regex node expected a string but got: #{@reStr}"
    @re = RegExp '('+@reStr+')', 'g' # TODO document why http://blog.stevenlevithan.com/archives/fixing-javascript-regexp
  parse$: @$wrap ($) -> $.code.match regex:@re
  contentString: -> magenta(''+@re)

# Main external access.
# I dunno if Grammar should be a GNode or not. It
# might come in handy when embedding grammars
# in some glue language.
@Grammar = Grammar = clazz 'Grammar', GNode, ->

  init: (rank) ->
    rank = rank(MACROS) if typeof rank is 'function'
    @rank = Rank.fromLines "__grammar__", rank if rank instanceof Array
    @rules = {}
    @numRules = 0
    @id2Rule = {} # slow lookup for debugging...

    # First, connect all the nodes and collect dereferences into @rules
    @rank.walk
      pre: (parent, node) =>
        # sanity check
        if node.parent? and node isnt node.rule
          throw Error 'Grammar tree should be a DAG, nodes should not be referenced more than once.'
        node.grammar = this
        node.parent = parent
        # set node.rule, the root node for this rule
        if not node.inlineLabel?
          node.rule ||= parent?.rule
        else
          # inline rules are special
          node.rule = node
          parent.rule.include node.inlineLabel, node
      post: (parent, node) =>
        if node is node.rule
          @rules[node.name] = node
          node.id = @numRules++
          @id2Rule[node.id] = node
          if trace.loop # print out id->rulename for convenience
            console.log "#{red node.id}:\t#{node}"

    # Now prepare all the nodes, child first.
    @rank.walk
      post: (parent, node) =>
        # call prepare on all nodes
        node.prepare()

  parse$: (code, {returnContext,env}={}) ->
    returnContext ?= no
    code = CodeStream code if code not instanceof CodeStream
    $ = ParseContext code:code, grammar:this, env:env
    $.result = @rank.parse $
    if $.code.pos isnt $.code.text.length
      # find the maximum parsed entity
      maxPos = $.code.pos
      for posFrames, pos in $.frames
        break if pos <= maxPos
        for frame, id in posFrames when frame
          maxPos = pos
          break
      throw Error "Incomplete parse in line #{$.code.line}: (#{white 'OK'}/#{yellow 'Parsing'}/#{red 'Unread'})\n\n#{
            $.code.peek beforeLines:2
        }#{ yellow $.code.peek afterChars:(maxPos-$.code.pos)
        }#{ $.code.pos = maxPos; red $.code.peek afterLines:2}\n"
    if returnContext
      return $
    else
      return $.result

Line = clazz 'Line', ->
  init: (@args...) ->
  # name:       The final and correct name for this rule
  # rule:       A rule-like object
  # parentRule: The actual parent Rule instance
  # attrs:      {cb,...}, extends the result
  # env:        Parse time env
  getRule: (name, rule, parentRule, attrs) ->
    if typeof rule is 'string'
      try
        # HACK: temporarily halt trace
        oldTrace = trace
        trace = stack:no, loop:no if trace.skipSetup
        rule = GRAMMAR.parse rule
        trace = oldTrace
      catch err
        console.log "Error in rule #{name}: #{rule}"
        console.log err.stack
        # TODO force debug output
        GRAMMAR.parse rule
    else if rule instanceof Array
      rule = Rank.fromLines name, rule
    else if rule instanceof OLine
      rule = rule.toRule parentRule, name:name
    assert.ok not rule.rule? or rule.rule is rule
    rule.rule = rule
    assert.ok not rule.name? or rule.name is name
    rule.name = name
    _.extend rule, attrs if attrs?
    rule

  # returns {rule:rule, attrs:{cb,skipCache,skipLog,...}}
  getArgs: ->
    [rule, rest...] = @args
    _a_ = rule:rule, attrs:{}
    for own key, value of rule
      if key in GNode.optionKeys
        _a_.attrs[key] = value
        delete rule[key]
    for next in rest
      if next instanceof Function
        _a_.attrs.cb = next
      else if next instanceof Object and next.constructor.name is 'Func'
        _a_.attrs.cbAST = next
      else if next instanceof Object and next.constructor.name is 'Word'
        _a_.attrs.cbName = next
      else
        _.extend _a_.attrs, next
    _a_
  toString: ->
    "#{@type} #{@args.join ','}"

ILine = clazz 'ILine', Line, ->
  type: 'i'
  toRules: (parentRule) ->
    {rule, attrs} = @getArgs()
    rules = {}
    # for an ILine, rule is an object of {"NAME":rule}
    for own name, _rule of rule
      rules[name] = @getRule name, _rule, parentRule, attrs
    rules

OLine = clazz 'OLine', Line, ->
  type: 'o'
  toRule: (parentRule, {index,name}) ->
    {rule, attrs} = @getArgs()
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
    rule = @getRule name, rule, parentRule, attrs
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
    regexAll = Regex("[ ]*(#{tokens.join('|')})[^a-zA-Z\\$_0-9]")
    for token in tokens
      name = '_'+token.toUpperCase()
      # HACK: temporarily halt trace
      oldTrace = trace
      trace = stack:no
      rule = GRAMMAR.parse "/[ ]*/ &:'#{token}' !/[a-zA-Z\\$_0-9]/"
      trace = oldTrace
      rule.rule = rule
      rule.skipLog = yes
      rule.skipCache = yes
      rule.cb = cb if cb?
      regexAll.include name, rule
    OLine regexAll
  # Helper for clazz construction in callbacks
  make: (clazz) -> (it) -> new clazz it

C  = -> Choice (x for x in arguments)
E  = -> Existential arguments...
L  = (label, node) -> node.label = label; node
La = -> Lookahead arguments...
N  = -> Not arguments...
P  = (value, join, min, max) -> Pattern value:value, join:join, min:min, max:max
R  = -> Ref arguments...
Re = -> Regex arguments...
S  = -> Sequence (x for x in arguments)
St = -> Str arguments...
{o, i, tokens}  = MACROS

# Don't worry, this is just the intermediate hand-compiled form of the grammar you can actually understand,
# located currently in tests/joeson.coffee. Look at that instead, and keep the two in sync until they get merged later.
@GRAMMAR = GRAMMAR = Grammar [
  o EXPR: [
    o S(R("CHOICE"), R("_"))
    o "CHOICE": [
      o S(P(R("_PIPE")), P(R("SEQUENCE"),R("_PIPE"),2), P(R("_PIPE"))), (it) -> new Choice it
      o "SEQUENCE": [
        o P(R("UNIT"),null,2), (it) -> new Sequence it
        o "UNIT": [
          o S(R("_"), R("LABELED"))
          o "LABELED": [
            o S(E(S(L("label",R("LABEL")), St(':'))), L('&',C(R("DECORATED"),R("PRIMARY"))))
            o "DECORATED": [
              o S(R("PRIMARY"), St('?')), (it) -> new Existential it
              o S(L("value",R("PRIMARY")), St('*'), L("join",E(S(N(R("__")), R("PRIMARY")))), L("@",E(R("RANGE")))), (it) -> new Pattern it
              o S(L("value",R("PRIMARY")), St('+'), L("join",E(S(N(R("__")), R("PRIMARY"))))), ({value,join}) -> new Pattern value:value, join:join, min:1
              o S(L("value",R("PRIMARY")), L("@",R("RANGE"))), (it) -> new Pattern it
              o S(St('!'), R("PRIMARY")), (it) -> new Not it
              o C(S(St('(?'), L("expr",R("EXPR")), St(')')), S(St('?'), L("expr",R("EXPR")))), (it) -> new Lookahead it
              i "RANGE": o S(St('{'), R("_"), L("min",E(R("INT"))), R("_"), St(','), R("_"), L("max",E(R("INT"))), R("_"), St('}'))
            ]
            o "PRIMARY": [
              o R("WORD"), (it) -> new Ref it
              o S(St('('), L("inlineLabel",E(S(R('WORD'), St(': ')))), L("expr",R("EXPR")), St(')'), E(S(R('_'), St('->'), R('_'), L("code",R("CODE"))))), ({expr, code}) ->
                {Func} = require('joeson/src/joescript').NODES
                {BoundFunc, Context} = require('joeson/src/interpreter/javascript')
                if code?
                  params = expr.labels
                  cbFunc = new Func params:params, type:'->', block:code
                  cbBFunc = new BoundFunc func:cbFunc, context:Context(global:@env?.global)
                  expr.cb = cbBFunc.function
                return expr
              i "CODE": o S(St("{"), P(S(N(St("}")), C(R("ESC1"), R(".")))), St("}")), (it) -> require('joeson/src/joescript').parse(it.join '')
              o S(St("'"), P(S(N(St("'")), C(R("ESC1"), R(".")))), St("'")), (it) -> new Str       it.join ''
              o S(St("/"), P(S(N(St("/")), C(R("ESC2"), R(".")))), St("/")), (it) -> new Regex     it.join ''
              o S(St("["), P(S(N(St("]")), C(R("ESC2"), R(".")))), St("]")), (it) -> new Regex "[#{it.join ''}]"
            ]
          ]
        ]
      ]
    ]
  ]
  i LABEL:    C(St('&'), St('@'), R("WORD"))
  i WORD:     Re("[a-zA-Z\\._][a-zA-Z\\._0-9]*")
  i INT:      Re("[0-9]+"), (it) -> new Number it
  i _PIPE:    S(R("_"), St('|'))
  i _:        P(C(St(' '), St('\n')))
  i __:       P(C(St(' '), St('\n')), null, 1)
  i '.':      Re("[\\s\\S]")
  i ESC1:     S(St('\\'), R("."))
  i ESC2:     S(St('\\'), R(".")), (chr) -> '\\'+chr
]

@NODES = {
  GNode, Choice, Rank, Sequence, Lookahead, Existential, Pattern, Not, Ref, Regex, Grammar
}
