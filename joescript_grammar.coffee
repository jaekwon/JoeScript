{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'
assert = require 'assert'
_ = require 'underscore'

Scope = clazz 'Scope', ->
  @VARIABLE = 'variable'
  @PARAMETER = 'parameter'
  init: (@vars=[], @params=[], @children=[]) ->
  addVar:   (name) ->
    return if name in @params
    @vars.push name if name not in @vars
  addParam: (name) ->
    @vars.push name if name not in @vars
    @params.push name if name not in @params
  addScope: (scope) ->
    assert.ok scope instanceof Scope
    @children.push scope
    scope.parent = this
  hasLocalVar: (name) ->
    return true if name in @vars
    return true if _.any @children, (child)->child.hasLocalVar(name)
    return false
  makeTempVar: (prefix='temp', isParam=no) ->
    # create a temporary variable that is not used in the inner scope
    idx = 0
    loop
      name = "#{prefix}#{idx++}"
      break unless @hasLocalVar name
    if isParam then @addParam name else @addVar name
    return name

Node = clazz 'Node', ->
  walk: ({pre, post, parent}) ->
    # pre, post: (parent, childNode) -> where childNode in parent.children.
    result = pre parent, @ if pre?
    unless result? and result.recurse is no
      children = this.children
      if children?
        for child in children
          if child instanceof Array
            for item in child when item instanceof Node
              item.walk {pre:pre, post:post, parent:@}
          else if child instanceof Node
            child.walk {pre:pre, post:post, parent:@}
    post parent, @ if post?
  # Gets called once after parsing and all
  # nodes/scopes are connected.
  prepare: ->

Word = clazz 'Word', Node, ->
  init: (@word) ->
    switch @word
      when 'undefined'
        @_newOverride = Undefined.undefined
      when 'null'
        @_newOverride = Null.null
  toString: -> @word

Block = clazz 'Block', Node, ->
  init: (lines) ->
    @lines = if lines instanceof Array then lines else [lines]
  children$: get: -> @lines
  toString: ->
    (''+line for line in @lines).join '\n'
  toStringWithIndent: ->
    '\n  '+((''+line).replace(/\n/g, '\n  ') for line in @lines).join('\n  ')+'\n'

If = clazz 'If', Node, ->
  init: ({@cond, @block, @else}) ->
    @block = Block @block if @block not instanceof Block
  children$: get: -> [@cond, @block, @else]
  toString: ->
    if @else?
      "if(#{@cond}){#{@block}}else{#{@else}}"
    else
      "if(#{@cond}){#{@block}}"

For = clazz 'For', Node, ->
  init: ({@label, @block, @own, @keys, @type, @obj, @cond}) ->
  children$: get: -> [@label, @block, @keys, @obj, @cond]
  prepare: ->
    @scope.addVar(key) for key in @keys
  toString: -> "for #{@own? and 'own ' or ''}#{@keys.join ','} #{@type} #{@obj} #{@cond? and "when #{@cond} " or ''}{#{@block}}"

While = clazz 'While', Node, ->
  init: ({@label, @cond, @block}) -> @cond ?= true
  children$: get: -> [@label, @cond, @block]
  toString: -> "while(#{@cond}){#{@block}}"

Loop = clazz 'Loop', While, ->
  init: ({@label, @block}) -> @cond = true
  children$: get: -> [@label, @block]

Switch = clazz 'Switch', Node, ->
  init: ({@obj, @cases, @default}) ->
  children$: get: -> [@obj, @cases, @default]
  toString: -> "switch(#{@obj}){#{@cases.join('//')}//else{#{@default}}}"

Try = clazz 'Try', Node, ->
  init: ({@block, @doCatch, @catchVar, @catchBlock, @finally}) ->
    if @catchVar? and @catchBlock?
      @catchBlock.scope = @catchBlock.ownScope = new Scope
  children$: get: -> [@block, @catchVar, @catchBlock, @finally]
  prepare: ->
    if @catchBlock? and @catchBlock.scope?
      @parent.scope.addScope @catchBlock.scope
      @catchBlock.scope.addVar @catchVar if @catchVar?
  toString: -> "try{#{@block}}#{
                @doCatch and "catch(#{@catchVar or ''}){#{@catchBlock}}" or ''}#{
                @finally and "finally{#{@finally}}" or ''}"

Case = clazz 'Case', Node, ->
  init: ({@matches, @block}) ->
  children$: get: -> [@matches, @block]
  toString: -> "when #{@matches.join ','}{#{@block}}"

Operation = clazz 'Operation', Node, ->
  init: ({@left, @not, @op, @right}) ->
  children$: get: -> [@left, @right]
  toString: -> "(#{@left or ''} #{@not and 'not ' or ''}#{@op} #{@right or ''})"

Statement = clazz 'Statement', Node, ->
  init: ({@type, @expr}) ->
  children$: get: -> [@expr]
  toString: -> "#{@type}(#{@expr ? ''});"

Invocation = clazz 'Invocation', Node, ->
  init: ({@func, @params}) ->
  children$: get: -> [@func, @params]
  toString: -> "#{@func}(#{@params.map((p)->"#{p}#{p.splat and '...' or ''}")})"

Assign = clazz 'Assign', Node, ->
  init: ({@target, @type, @value}) -> @type ||= '='
  children$: get: -> [@target, @value]
  prepare: ->
    @scope.addVar @target if @target instanceof Word or typeof @target is 'string'
  toString: -> "#{@target}#{@type}(#{@value})"

Slice = clazz 'Slice', Node, ->
  init: ({@obj, @range}) ->
  children$: get: -> [@obj, @range]
  toString: -> "#{@obj}[#{@range}]"

Index = clazz 'Index', Node, ->
  init: ({obj, attr, type}) ->
    type ?= if attr instanceof Word or typeof attr is 'string' then '.' else '['
    if type is '::'
      if attr?
        obj = Index obj:obj, attr:'prototype', type:'.'
      else
        attr = 'prototype'
      type = '.'
    @obj = obj
    @attr = attr
    @type = type
  children$: get: -> [@obj, @attr]
  toString: ->
    close = if @type is '[' then ']' else ''
    "#{@obj}#{@type}#{@attr}#{close}"

Soak = clazz 'Soak', Node, ->
  init: (@obj) ->
  children$: get: -> [@obj]
  toString: -> "(#{@obj})?"

Obj = clazz 'Obj', Node, ->
  init: (@items) ->
  children$: get: -> @items
  toString: -> "{#{if @items? then @items.join ',' else ''}}"

Null = clazz 'Null', Node, ->
  @null = new @()
  toString: -> "null"

Undefined = clazz 'Undefined', Node, ->
  @undefined = new @()
  toString: -> "undefined"

This = clazz 'This', Node, ->
  init: ->
  toString: -> "@"

Arr = clazz 'Arr', Obj, ->
  children$: get: -> @items
  toString: -> "[#{if @items? then @items.join ',' else ''}]"

Item = clazz 'Item', Node, ->
  init: ({@key, @value}) ->
  children$: get: -> [@key, @value]
  toString: -> @key+(if @value?   then ":(#{@value})"   else '')

Str = clazz 'Str', Node, ->
  init: (@parts) ->
  children$: get: -> @parts
  isStatic: get: -> _.all @parts, (part)->typeof part is 'string'
  toString: ->
    if typeof @parts is 'string'
      '"' + @parts.replace(/"/g, "\\\"") + '"'
    else
      parts = @parts.map (x) ->
        if x instanceof Node
          '#{'+x+'}'
        else
          x.replace /"/g, "\\\""
      '"' + parts.join('') + '"'

Func = clazz 'Func', Node, ->
  init: ({@params, @type, @block}) ->
    @scope = @ownScope = new Scope
  children$: get: -> [@params, @block]
  prepare: ->
    @parent.scope.addScope @scope
    addParam = (thing) =>
      if thing instanceof Word or typeof thing is 'string'
        @scope.addParam thing
      else if thing instanceof Arr
        addParam(item) for item in thing.items
      else if thing instanceof Obj
        for item in thing.items
          if item.value
            addParam(item.value)
          else
            addParam(item)
      else if thing instanceof Index # @name
        "pass"
    addParam(param) for param in @params if @params?
  toString: -> "(#{if @params then @params.map(
      (p)->"#{p}#{p.splat and '...' or ''}#{p.default and '='+p.default or ''}"
    ).join ',' else ''})#{@type}{#{@block}}"

Range = clazz 'Range', Node, ->
  init: ({@start, @type, @end, @by}) ->
    @by ?= 1
  children$: get: -> [@start, @end, @by]
  toString: -> "Range(#{@start? and "start:#{@start}," or ''}"+
                     "#{@end?   and "end:#{@end},"     or ''}"+
                     "type:'#{@type}', by:#{@by})"

Heredoc = clazz 'Heredoc', Node, ->
  init: (@text) ->
  toString: -> "####{@text}###"

Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{@args}}"

@NODES = {
  Node, Word, Block, If, For, While, Loop, Switch, Try, Case, Operation,
  Statement, Invocation, Assign, Slice, Index, Soak, Obj, This,
  Null, Undefined,
  Arr, Item, Str, Func, Range, Heredoc, Dummy
}

__init__ = (node) ->

  # create a global scope for node if it doesn't already exist.
  if not node.scope?
    node.scope = node.ownScope = Scope()

  # connect all nodes to their parents, set scope, and prepare.
  node.walk
    pre: (parent, node) ->
      assert.ok node?
      node.parent ||= parent
      node.scope  ||= parent.scope
    post:(parent, node) ->
      node.prepare()

  # collect all variables to the scope.
  node.walk
    pre: (parent, node) ->
      if node instanceof Assign
        if node.target instanceof Word or typeof node.target is 'string'
          varname = ''+node.target
          node.scope.addVar varname

  node

debugIndent = yes

checkIndent = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily

  container = @stack[@stack.length-2]
  @log "[In] container (@#{@stack.length-2}:#{container.name}) indent:'#{container.indent}', softline:'#{container.softline}'" if debugIndent
  if container.softline?
    # {
    #   get: -> # begins with a softline
    #   set: ->
    # }
    pIndent = container.softline
  else
    # Get the parent container's indent string
    for i in [@stack.length-3..0] by -1
      if @stack[i].softline? or @stack[i].indent?
        pContainer = @stack[i]
        pIndent = pContainer.softline ? pContainer.indent
        @log "[In] parent pContainer (@#{i}:#{pContainer.name}) indent:'#{pContainer.indent}', softline:'#{pContainer.softline}'" if debugIndent
        break
  # If ws starts with pIndent... valid
  if ws.length > pIndent.length and ws.indexOf(pIndent) is 0
    @log "Setting container.indent to '#{ws}'"
    container.indent = ws
    return container.indent
  null

checkNewline = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily

  # find the container INDENT on the stack
  for i in [@stack.length-2..0] by -1
    if @stack[i].softline? or @stack[i].indent?
      container = @stack[i]
      break

  containerIndent = container.softline ? container.indent
  isNewline = ws is containerIndent
  @log "[NL] container (@#{i}:#{container.name}) indent:'#{container.indent}', softline:'#{container.softline}', isNewline:'#{isNewline}'" if debugIndent
  return ws if isNewline
  null

# like a newline, but allows additional padding
checkSoftline = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily

  # find the applicable indent
  container = null
  for i in [@stack.length-2..0] by -1
    if i < @stack.length-2 and @stack[i].softline?
      # a strict ancestor's container's softline acts like an indent.
      # this allows softlines to be shortened only within the same direct container.
      container = @stack[i]
      @log "[SL] (@#{i}:#{container.name}) indent(ignored):'#{container.indent}', **softline**:'#{container.softline}'" if debugIndent
      break
    else if @stack[i].indent?
      container = @stack[i]
      @log "[SL] (@#{i}:#{container.name}) **indent**:'#{container.indent}', softline(ignored):'#{container.softline}'" if debugIndent
      break
  if container is null
    throw new Error "QWE"
  # commit softline ws to container
  if ws.indexOf(container.softline ? container.indent) is 0
    topContainer = @stack[@stack.length-2]
    @log "[SL] Setting topmost container (@#{@stack.length-2}:#{topContainer.name})'s softline to '#{ws}'"
    topContainer.softline = ws
    return ws
  null

checkComma = ({beforeBlanks, beforeWS, afterBlanks, afterWS}) ->
  @storeCache = no
  if afterBlanks.length > 0
    return null if checkSoftline.call(this, afterWS) is null
  else if beforeBlanks.length > 0
    return null if checkSoftline.call(this, beforeWS) is null
  ','

resetIndent = (ws) ->
  @storeCache = no
  @stack[0].indent ?= '' # set default lazily
  # find any container
  container = @stack[@stack.length-2]
  assert.ok container?
  @log "setting container(=#{container.name}).indent to '#{ws}'"
  container.indent = ws
  return container.indent

@GRAMMAR = Grammar ({o, i, tokens}) -> [
  o                                 "_BLANKLINE* LINES ___", __init__
  i LINES:                          "LINE*_NEWLINE", Block
  i LINE: [
    o HEREDOC:                      "_ '###' !'#' (!'###' .)* '###'", (it) -> Heredoc it.join ''
    o LINEEXPR: [
      # left recursive
      o POSTIF:                     "block:LINEEXPR _IF cond:EXPR", If
      o POSTUNLESS:                 "block:LINEEXPR _UNLESS cond:EXPR", ({cond}) -> If cond:Operation(op:'not', right:cond)
      o POSTFOR:                    "block:LINEEXPR _FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)?", For
      # rest
      o STMT:                       "type:(_RETURN|_THROW|_BREAK|_CONTINUE) expr:EXPR?", Statement
      o EXPR: [
        o FUNC:                     "params:PARAMS? _ type:('->'|'=>') block:BLOCK?", Func
        i PARAMS:                   "_ '(' (&:PARAM default:(_ '=' LINEEXPR)?)*_COMMA _ ')'"
        i PARAM:                    "&:SYMBOL splat:'...'?
                                    |&:PROPERTY splat:'...'?
                                    |OBJ_EXPL
                                    |ARR_EXPL"
        o RIGHT_RECURSIVE: [
          o INVOC_IMPL:             "func:ASSIGNABLE __ params:(&:EXPR splat:'...'?)+(_COMMA|!_NEWLINE _SOFTLINE)", Invocation
          o OBJ_IMPL:               "_INDENT? OBJ_IMPL_ITEM+(_COMMA|_NEWLINE)
                                     | OBJ_IMPL_ITEM+_COMMA", Obj
          i OBJ_IMPL_ITEM:          "key:(WORD|STRING) _ ':' value:EXPR", Item
          o ASSIGN:                 "target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||=') value:BLOCKEXPR", Assign
        ]
        o COMPLEX: [
          o IF:                     "_IF cond:EXPR block:BLOCK ((_NEWLINE | _INDENT)? _ELSE else:BLOCK)?", If
          o FOR:                    "_FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK", For
          o LOOP:                   "_LOOP block:BLOCK", While
          o WHILE:                  "_WHILE cond:EXPR block:BLOCK", While
          o SWITCH:                 "_SWITCH obj:EXPR _INDENT cases:CASE*_NEWLINE default:DEFAULT?", Switch
          i CASE:                   "_WHEN matches:EXPR+_COMMA block:BLOCK", Case
          i DEFAULT:                "_NEWLINE _ELSE BLOCK"
          o TRY:                    "_TRY block:BLOCK
                                     (_NEWLINE? doCatch:_CATCH catchVar:EXPR? catchBlock:BLOCK?)?
                                     (_NEWLINE? _FINALLY finally:BLOCK)?", Try
        ]
        o OP_OPTIMIZATION:          "OP40 _ !(OP00_OP|OP05_OP|OP10_OP|OP20_OP|OP30_OP)"
        o OP00: [
          i OP00_OP:                " '&&' | '||' | '&' | '|' | '^' | _AND | _OR "
          o                         "left:(OP00|OP05) _ op:OP00_OP _SOFTLINE? right:OP05", Operation
          o OP05: [
            i OP05_OP:              " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
            o                       "left:(OP05|OP10) _ op:OP05_OP _SOFTLINE? right:OP10", Operation
            o OP10: [
              i OP10_OP:            " '+' | '-' "
              o                     "left:(OP10|OP20) _ op:OP10_OP _SOFTLINE? right:OP20", Operation
              o OP20: [
                i OP20_OP:          " '*' | '/' | '%' "
                o                   "left:(OP20|OP30) _ op:OP20_OP _SOFTLINE? right:OP30", Operation
                o OP30: [
                  i OP30_OP:        "not:_NOT? op:(_IN|_INSTANCEOF)"
                  o                 "left:(OP30|OP40) _  @:OP30_OP _SOFTLINE? right:OP40", Operation
                  o OP40: [
                    i OP40_OP:      " _NOT | '!' | '~' "
                    o               "_ op:OP40_OP right:OP45", Operation
                    o OP45: [
                      i OP45_OP:    " '?' "
                      o             "left:(OP45|OP50) _ op:OP45_OP _SOFTLINE? right:OP50", Operation
                      o OP50: [
                        i OP50_OP:  " '--' | '++' "
                        o           "left:OPATOM op:OP50_OP", Operation
                        o           "_ op:OP50_OP right:OPATOM", Operation
                        o OPATOM:   "FUNC | RIGHT_RECURSIVE | COMPLEX | ASSIGNABLE"
                      ] # end OP50
                    ] # end OP45
                  ] # end OP40
                ] # end OP30
              ] # end OP20
            ] # end OP10
          ] # end OP05
        ] # end OP00
      ] # end EXPR
    ] # end LINEEXPR
  ] # end LINE

  i ASSIGNABLE: [
    # left recursive
    o SLICE:        "obj:ASSIGNABLE !__ range:RANGE", Slice
    o INDEX0:       "obj:ASSIGNABLE type:'['  attr:LINEEXPR _ ']'", Index
    o INDEX1:       "obj:ASSIGNABLE type:'.'  attr:WORD", Index
    o PROTO:        "obj:ASSIGNABLE type:'::' attr:WORD?", Index
    o INVOC_EXPL:   "func:ASSIGNABLE '(' ___ params:(&:LINEEXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ ')'", Invocation
    o SOAK:         "ASSIGNABLE '?'", Soak
    # rest
    o TYPEOF: [
      o             "func:_TYPEOF '(' ___ params:LINEEXPR{1,1} ___ ')'", Invocation
      o             "func:_TYPEOF __ params:LINEEXPR{1,1}", Invocation
    ]
    o RANGE:        "_ '[' start:LINEEXPR? _ type:('...'|'..') end:LINEEXPR? _ ']' by:(_BY EXPR)?", Range
    o ARR_EXPL:     "_ '[' _SOFTLINE? (&:LINEEXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ ']'", Arr
    o OBJ_EXPL:     "_ '{' _SOFTLINE? OBJ_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ '}'", Obj
    i OBJ_EXPL_ITEM: "key:(PROPERTY|WORD|STRING) value:(_ ':' LINEEXPR)?", Item
    o PAREN:        "_ '(' ___ LINEEXPR ___ ')'"
    o PROPERTY:     "_ '@' (WORD|STRING)", (attr) -> Index obj:This(), attr:attr
    o THIS:         "_ '@'", This
    o REGEX:        "_ _FSLASH &:(!_FSLASH (ESC2 | .))* _FSLASH <words:1> flags:/[a-zA-Z]*/", Str
    o STRING: [
      o             "_ _QUOTE  (!_QUOTE  (ESCSTR | .))* _QUOTE",  Str
      o             "_ _TQUOTE (!_TQUOTE (ESCSTR | INTERP | .))* _TQUOTE", Str
      o             "_ _DQUOTE (!_DQUOTE (ESCSTR | INTERP | .))* _DQUOTE", Str
      i ESCSTR:     "_SLASH .", (it) -> {n:'\n', t:'\t', r:'\r'}[it] or it
      i INTERP:     "'\#{' _BLANKLINE* _RESETINDENT LINEEXPR ___ '}'"
    ]
    o BOOLEAN:      "_TRUE | _FALSE", (it) -> it is 'true'
    o NUMBER:       "_ <words:1> /-?[0-9]+(\\.[0-9]+)?/", Number
    o SYMBOL:       "_ !_KEYWORD WORD"
  ]

  # BLOCKS:
  i BLOCK: [
    o               "_INDENT LINE*_NEWLINE", Block
    o               "_THEN?  LINE+(_ ';')", Block
  ]
  i BLOCKEXPR:      "_INDENT? EXPR"
  i _INDENT:        "_BLANKLINE+ &:_", checkIndent, skipCache:yes
  i _RESETINDENT:   "_BLANKLINE* &:_", resetIndent, skipCache:yes
  i _NEWLINE: [
    o               "_BLANKLINE+ &:_", checkNewline, skipCache:yes
    o               "_ ';'"
  ], skipCache:yes
  i _SOFTLINE:      "_BLANKLINE+ &:_", checkSoftline, skipCache:yes
  i _COMMA:         "beforeBlanks:_BLANKLINE* beforeWS:_ ','
                      afterBlanks:_BLANKLINE*  afterWS:_", checkComma, skipCache:yes

  # TOKENS:
  i WORD:           "_ <words:1> /[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/", Word
  i _KEYWORD:       tokens('if', 'unless', 'else', 'for', 'own', 'in', 'of',
                      'loop', 'while', 'break', 'continue',
                      'switch', 'when', 'return', 'throw', 'then', 'is', 'isnt', 'true', 'false', 'by',
                      'not', 'and', 'or', 'instanceof', 'typeof', 'try', 'catch', 'finally')
  i _QUOTE:         "'\\''"
  i _DQUOTE:        "'\"'"
  i _TQUOTE:        "'\"\"\"'"
  i _FSLASH:        "'/'"
  i _SLASH:         "'\\\\'"
  i '.':            "<chars:1> /[\\s\\S]/",            skipLog:yes
  i ESC1:           "_SLASH .",                        skipLog:yes
  i ESC2:           "_SLASH .", ((chr) -> '\\'+chr),   skipLog:yes

  # WHITESPACES:
  i _:              "<words:1> /[ ]*/",                skipLog:yes
  i __:             "<words:1> /[ ]+/",                skipLog:yes
  i _TERM:          "_ ('\r\n'|'\n')",                 skipLog:yes
  i _COMMENT:       "_ !HEREDOC '#' (!_TERM .)*",      skipLog:yes
  i _BLANKLINE:     "_ _COMMENT? _TERM",               skipLog:yes
  i ___:            "_BLANKLINE* _",                   skipLog:yes

]
# ENDGRAMMAR
