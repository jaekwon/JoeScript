{
  clazz,
  colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}
  collections:{Set}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'
{Grammar} = require 'sembly/src/joeson'
Node = require('sembly/src/node').createNodeClazz('CodeNode')


# Helpers, exported to HELPERS
extend = (dest, source) -> dest.push x for x in source
isKey = (thing) -> typeof thing is 'string' or thing instanceof Word or thing instanceof Undetermined
isVariable = (thing) -> thing instanceof Word or thing instanceof Undetermined
isIndex = (thing) -> thing instanceof Index
isSoakable = (thing) -> thing instanceof Slice or thing instanceof Index or thing instanceof Invocation or thing instanceof Soak
@HELPERS = {extend, isKey, isVariable, isIndex, isSoakable}

_soakable = (name) ->
  get: -> @[name] if isSoakable @[name]
  set: (it) -> @[name] = it

Word = clazz 'Word', Node, ->
  init: (@key) ->
  toString: -> @key
  toKeyString: -> @key

# An undetermined variable.
# src/translator/scope is responsible for setting @key.
Undetermined = clazz 'Undetermined', Word, ->
  init: (@prefix) -> @key = undefined
  toString: -> "[Undetermined prefix:#{@prefix}]"
  toKeyString: ->
    assert.ok @key?, "Variable name not yet determined!"
    return @key

String::toKeyString = -> @valueOf()

Block = clazz 'Block', Node, ->
  init: (lines) ->
    assert.ok lines, "lines must be defined"
    @lines = if lines instanceof Array then lines else [lines]
  toString: ->
    (''+line for line in @lines).join ';\n'

DoBlock = (lines) ->
  Invocation
    func:     'do'
    params:   [Item(value:Func(block:Block(lines)))]

If = clazz 'If', Node, ->
  init: ({@cond, @block, @else}) ->
    @block = Block @block if @block not instanceof Block
  toString: ->
    if @else?
      "if(#{@cond}){#{@block}}else{#{@else}}"
    else
      "if(#{@cond}){#{@block}}"

Unless = ({cond, block, _else}) -> If cond:Not(cond), block:block, else:_else

Loop = clazz 'Loop', Node, ->
  init: ({@label, @cond, @block}) -> @cond ?= true
  isJSValue: no
  toString: -> "while(#{@cond}){#{@block}}"

For = clazz 'For', Loop, ->
  # types:
  #   in: Array / generator iteration,  e.g.  for @keys[0] in @obj {@block}
  #   of: Object key-value iteration,   e.g.  for @keys[0], @keys[1] of @obj {@block}
  init: ({@label, @block, @own, @keys, @type, @obj, @cond}) ->
  toString: -> "for #{@own? and 'own ' or ''}#{@keys.join ','} #{@type} #{@obj} #{@cond? and "when #{@cond} " or ''}{#{@block}}"

# Javascript C-style For-loop
JSForC = clazz 'JSForC', Loop, ->
  init: ({@label, @block, @setup, @cond, @counter}) ->
  toString: -> "for (#{@setup or ''};#{@cond or ''};#{@counter or ''}) {#{@block}}"

# Javascript Object Key iteration
JSForK = clazz 'JSForK', Loop, ->
  init: ({@label, @block, @key, @obj}) ->
  toString: -> "for (#{@key} in #{@obj}) {#{@block}}"

Switch = clazz 'Switch', Node, ->
  init: ({@obj, @cases, @default}) ->
  isJSValue: no
  toString: -> "switch(#{@obj}){#{@cases.join('//')}//else{#{@default}}}"

Try = clazz 'Try', Node, ->
  init: ({@block, @catchVar, @catch, @finally}) ->
  isJSValue: no
  toString: -> "try {#{@block}}#{
                (@catchVar? or @catch?) and " catch (#{@catchVar or ''}) {#{@catch}}" or ''}#{
                @finally and "finally {#{@finally}}" or ''}"

Case = clazz 'Case', Node, ->
  init: ({@matches, @block}) ->
  toString: -> "when #{@matches.join ','}{#{@block}}"

Operation = clazz 'Operation', Node, ->
  init: ({@left, @op, @right}) ->
  toString: -> "(#{ if @left?  then @left+' '  else ''
                }#{ @op
                }#{ if @right? then ' '+@right else '' })"

Not = (it) -> Operation op:'not', right:it

Statement = clazz 'Statement', Node, ->
  init: ({@type, @expr}) ->
  isJSValue: no
  isReturn$: get: -> @type is 'return'
  toString: -> "#{@type}(#{@expr ? ''});"

Invocation = clazz 'Invocation', Node, ->
  init: ({@func, @params, @binding}) ->
    @type = if ''+@func is 'new' then 'new' # TODO doesnt do anything
  soakable$: _soakable 'func'
  toString: ->
    if @binding?
      "#{@func}.call(#{@binding};#{@params ? ''})"
    else
      "#{@func}(#{@params ? ''})"

Assign = clazz 'Assign', Node, ->
  # type: =, +=, -=. *=, /=, ?=, ||= ...
  init: ({@target, type, @op, @value}) ->
    assert.ok not (@target instanceof AssignObj and @op?), "You can't specify both a destructing assignment and an operation"
    assert.ok @value?, "need value"
    @op = type[...type.length-1] or undefined if type?
  soakable$: _soakable 'target'
  toString: -> "#{@target} #{@op or ''}= (#{@value})"

Slice = clazz 'Slice', Node, ->
  init: ({@obj, @range}) ->
  soakable$: _soakable 'obj'
  toString: -> "#{@obj}[#{@range}]"

Index = clazz 'Index', Node, ->
  init: ({obj, key, type}) ->
    key = Word(key) if typeof key is 'string' and type is '.'
    type ?= if key instanceof Word then '.' else '['
    if type is '::'
      if key?
        obj = Index obj:obj, key:'prototype', type:'.'
      else
        key = Word('prototype')
      type = '.'
    @obj = obj
    @key = key
    @type = type
  isThisProp$: get: -> @obj instanceof Word and @obj.key is 'this'
  soakable$: _soakable 'obj'
  toString: ->
    close = if @type is '[' then ']' else ''
    "#{@obj}#{@type}#{@key}#{close}"

Soak = clazz 'Soak', Node, ->
  init: (@obj) ->
  soakable$: _soakable 'obj'
  toString: -> "(#{@obj})?"

Obj = clazz 'Obj', Node, ->
  # NOTE Items may contain Heredocs.
  # TODO consider filtering them out or organizing the heredocs
  init: (@items) ->
  toString: -> "{#{if @items? then @items.join ',' else ''}}"
  validate: ->
    Node::validate.call @
    if @items? then for item in @items when item instanceof Item
      if not item.key?  then throw new Error "<Item>.key must be defined for an Obj #{item}"
      if item.splat     then throw new Error "<Item> can't have splat for an Obj"

Arr = clazz 'Arr', Obj, ->
  toString: -> "[#{if @items? then @items.join ',' else ''}]"
  validate: ->
    Node::validate.call @
    if @items? then for item in @items when item instanceof Item
      if item.key?      then throw new Error "<Item>.key must NOT be defined for an Arr"
    # TODO ensure that only one has a splat

# For arrays and invocation parameters, the key is left undefined.
# For objects, the key is always defined, and the value is optional.
# e.g. {foo} is equivalent to {foo:foo}
Item = clazz 'Item', Node, ->
  init: ({@key, @value, @splat}) ->
  toString: ->
    "#{ if @key?              then @key         else ''
    }#{ if @key? and @value?  then ':'          else ''
    }#{ if @value?            then @value       else ''
    }#{ if @splat             then '...'        else '' }"

Singleton = clazz 'Singleton', Node, ->
  init: (@name) ->
  toString: -> @name

Singleton[x] = new Singleton(x) for x in ['null', 'undefined', 'Infinity']

Str = clazz 'Str', Node, ->
  init: (parts, {dedent}={}) ->
    @parts = []
    chars = []
    for item in parts
      if typeof item is 'string'
        chars.push item
      else if item instanceof Node
        if chars.length > 0
          @parts.push chars.join('')
          chars = []
        @parts.push item
      else throw new Error "Dunno how to handle part of Str: #{item} (#{item.constructor.name})"
    if chars.length > 0
      @parts.push chars.join('')
    if dedent
      # We need to do this here, so indents in interpolations don't affect calc.
      # '''
      #   abc
      #     xyz
      # ''' --> 'abc\n  xyz'
      minIndent = Infinity
      # Trim and find minimum indent level.
      for str, i in @parts when typeof str is 'string'
        str = @parts[i] = str.replace(/^\n +/, '') if i is 0
        str = @parts[i] = str.replace(/\n +$/, '') if i is @parts.length-1
        str.each /(?:^|\n)( +)/, (m) ->
          minIndent = Math.min(
            minIndent,
            if m[0] is '\n' then m.length-1 else m.length
          )
      # Maybe dedent
      if minIndent isnt Infinity and minIndent > 0
        for str, i in @parts when typeof str is 'string'
          @parts[i] = str.replace RegExp("(^|\\n)( {#{minIndent}})", 'g'), '$1'
      # Filter blank strings.
      @parts = (part for part in @parts when not (typeof part is 'string' and not part))
  isStatic: get: -> @parts.every (part) -> typeof part is 'string'
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

Regex = clazz 'Regex', Node, ->
  init: ({pattern, @flags}) -> @pattern = pattern.join ''
  toString: -> "/#{@pattern}/#{@flags}"

Func = clazz 'Func', Node, ->
  init: ({@params, @type, @block}) ->
    @block ?= new Block([]) # trans
  toString: ->
    "#{ if @params? then '('+@params.toString(no)+')' else '()'
    }#{ @type
    }#{ '{'+@block+'}' }"

AssignObj = clazz 'AssignObj', Node, ->
  init: (@items) ->
  targetNames$: get: ->
    names = []
    for item in @items
      target = item.target ? item.key
      if isVariable target
        names.push target
      else if target instanceof AssignObj
        extend names, target.targetNames
      else if target instanceof Index
        "pass" # nothing to do for properties
      else
        throw new Error "Unexpected AssignObj target #{target} (#{target?.constructor.name})"
    return names
  toString: -> "{#{if @items? then @items.join ',' else ''}}"

AssignList = clazz 'AssignList', AssignObj, ->
  init: (@items) ->
  toString: (braces=yes) ->
    "#{ if braces  then '['             else ''
    }#{ if @items? then @items.join ',' else ''
    }#{ if braces  then ']'             else '' }"

# For AssignLists and function parameters the key is left undefined.
# For AssignObjs, the key is always defined, and the target is optional.
AssignItem = clazz 'AssignItem', Node, ->
  init: ({@key, @target, @default, @splat}) ->
  toString: ->
    "#{ if @key?              then @key         else ''
    }#{ if @key? and @target? then ':'          else ''
    }#{ if @target?           then @target      else ''
    }#{ if @splat             then '...'        else ''
    }#{ if @default?          then '='+@default else '' }"

Range = clazz 'Range', Node, ->
  init: ({@from, type, @to, @by}) ->
    @exclusive = type is '...'
    @by ?= 1
  toString: -> "Range(#{@from? and "from:#{@from}," or ''}"+
                     "#{@to?   and "to:#{@to},"     or ''}"+
                     "exclusive:#{@exclusive}, by:#{@by})"

NativeExpression = clazz 'NativeExpression', Node, ->
  init: (@exprStr) ->
  toString: -> "`#{@exprStr}`"

Heredoc = clazz 'Heredoc', Node, ->
  init: (@text) ->
  toString: -> "####{@text}###"

Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{@args}}"

# NODE TYPE GROUPS
EXPR = new Set([Node, 'string', 'number', 'boolean'])
KEY  = new Set([Word, Str, 'string', 'number'])

# NOTE: defineChildren requires proper ordering.
# Make sure you define the base class children first.
Block.defineChildren
  lines:      {type:[type:EXPR]}
If.defineChildren
  cond:       {type:EXPR, isValue:yes}
  block:      {type:EXPR, required:yes}
  else:       {type:EXPR}
Loop.defineChildren
  label:      {type:Word}
  cond:       {type:EXPR, isValue:yes}
  block:      {type:EXPR, required:yes}
For.defineChildren # extends Loop
  keys:       {type:[type:Node]}
  obj:        {type:EXPR, isValue:yes}
JSForC.defineChildren # extends Loop
  setup:      {type:Node}
  counter:    {type:Node}
JSForK.defineChildren # extends Loop
  cond:       null
  key:        {type:Word, required:yes}
  obj:        {type:EXPR, isValue:yes, required:yes}
Switch.defineChildren
  obj:        {type:EXPR, isValue:yes, required:yes}
  cases:      {type:[type:Case]}
  default:    {type:EXPR}
Try.defineChildren
  block:      {type:Node, required:yes}
  catchVar:   {type:Word}
  catch:      {type:Node}
  finally:    {type:Node}
Case.defineChildren
  matches:    {type:[type:EXPR], required:yes}
  block:      {type:Node}
Operation.defineChildren
  left:       {type:EXPR, isValue:yes}
  right:      {type:EXPR, isValue:yes}
Statement.defineChildren
  expr:       {type:EXPR, isValue:yes}
Invocation.defineChildren
  func:       {type:EXPR, isValue:yes}
  params:     {type:[type:Item,isValue:yes]}
  binding:    {type:EXPR, isValue:yes}
Assign.defineChildren
  target:     {type:Node, required:yes}
  value:      {type:EXPR, isValue:yes, required:yes}
Slice.defineChildren
  obj:        {type:EXPR, isValue:yes}
  range:      {type:Range, required:yes}
Index.defineChildren
  obj:        {type:EXPR, isValue:yes}
  key:        {type:EXPR, isValue:yes, required:yes}
Soak.defineChildren
  obj:        {type:EXPR, isValue:yes}
Obj.defineChildren # and Arr
  items:      {type:[type:Set([Item,Heredoc])]}
Item.defineChildren
  key:        {type:KEY}
  value:      {type:EXPR, isValue:yes}
Str.defineChildren
  parts:      {type:[type:EXPR, isValue:yes]}
Func.defineChildren
  params:     {type:AssignList}
  block:      {type:Block, required:yes} # must be block
AssignObj.defineChildren
  items:      {type:[type:AssignItem]}
AssignItem.defineChildren
  key:        {type:new Set([Word, Index, 'number'])}
  target:     {type:Node}
  default:    {type:EXPR, isValue:yes}
Range.defineChildren
  from:       {type:EXPR, isValue:yes}
  to:         {type:EXPR, isValue:yes}
  by:         {type:EXPR, isValue:yes}

@NODES = {
  Node, Word, Block, DoBlock, If, Loop, For, Switch, Try, Case, Operation,
  Statement, Invocation, Assign, Slice, Index, Soak, Obj,
  Singleton,
  Arr, Item, Str, Regex, Func, Range, NativeExpression, Heredoc, Dummy,
  AssignList, AssignObj, AssignItem,
  Undetermined, JSForC, JSForK
}

trace =
  indent:no

setup = (__, $) ->
  $.stack[0].indent = ''

_iC = ($, skip=0) ->
  for i in [$.stackLength-1-skip..0] by -1
    if $.stack[i].softline? or $.stack[i].indent?
      container = $.stack[i]
      if container.softline?
        indent = container.softline
        isSoft = yes
      else
        indent = container.indent
        isSoft = no
      return {container, indent, i, isSoft}
  return null

checkIndent = (ws, $) ->
  {indent, container} = _iC $, 1
  debug "checkIndent: [#{ws}], [#{indent}]" if trace.indent
  if ws.startsWith(indent) and ws > indent
    #$.stackPeek(1).markedColumn = $.code.col
    return $.stackPeek(1).indent = ws
  null

checkNewline = (ws, $) ->
  {indent, container} = _iC $, 1
  return if (ws is indent) then ws else null

# Could be a newline or an indent (except the indent can be shortened within a common container)
# e.g.
# someFunction("param1",
#     "param2",
#   "param3") # <-- dedented here, but it's still to the right of someFunction.
checkSoftline = (ws, $) ->
  {indent, container, i, isSoft} = _iC $, 1
  if directContainer=(i is $.stackLength-2) and isSoft
    {indent, container} = _iC $, 2
  if ws.startsWith(indent)
    return $.stackPeek(1).softline = ws
  null

# An indent that can be dedented within a common container.
# Like checkSoftline, except it can't be a newline.
checkSoftdent = (ws, $) ->
  {indent, container, i, isSoft} = _iC $, 1
  if directContainer=(i is $.stackLength-2) and isSoft
    {indent, container} = _iC $, 2
  if ws.startsWith(indent) and ws > indent
    return $.stackPeek(1).softline = ws
  null

checkComma = ({beforeBlanks, beforeWS, afterBlanks, afterWS}, $) ->
  container = $.stack[$.stackLength-2]
  container.trailingComma = yes if afterBlanks?.length > 0
  if afterBlanks.length > 0
    return null if checkSoftline(afterWS, $) is null
  else if beforeBlanks.length > 0
    return null if checkSoftline(beforeWS, $) is null
  ','

checkHadComma = (__, $) ->
  return null if not $.stackPeek(1).trailingComma
  return 'checkHadComma:ok'

resetIndent = (ws, $) ->
  return $.stackPeek(1).indent = ws

# TODO assumes that all whitespaces are 1 char long.
# TODO document
markColumn = (__, $) ->
  $.stackPeek(1).markedColumn = $.code.col
checkColumn = (__, $) ->
  column = $.code.col
  if column is $.stackPeek(1).markedColumn
    return 'checkColumn:ok'
  for i in [$.stackLength-1-2..0] by -1
    item = $.stack[i]
    indent = item.softline ? item.indent
    if indent? and column < indent.length then return null
    markedColumn = item.markedColumn
    if markedColumn? and column <= markedColumn then return null
  return 'checkColumn:ok'

@GRAMMAR = GRAMMAR = Grammar ({o, i, tokens, make}) -> [
  o                                 " _SETUP _BLANKLINE* LINES ___ "
  i _SETUP:                         " '' ", (setup)
  i LINES:                          " _MARK_COL LINE*_NEWLINE _ _SEMICOLON? ", (make Block)
  i LINE: [
    o HEREDOC:                      " _ '###' !'#' (!'###' .)* '###' ", ((it) -> Heredoc it.join '')
    o LINEEXPR: [
      # left recursive
      o POSTIF:                     " block:LINEEXPR _IF cond:EXPR ", (make If)
      o POSTUNLESS:                 " block:LINEEXPR _UNLESS cond:EXPR ", (make Unless)
      o POSTFOR:                    " block:LINEEXPR _FOR own:_OWN? __ keys:ASSIGNABLE*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? ", (make For)
      o POSTWHILE:                  " block:LINEEXPR _WHILE cond:EXPR ", (make Loop)
      # rest
      o STMT:                       " type:(_RETURN|_THROW|_BREAK|_CONTINUE) expr:EXPR? ", (make Statement)
      o EXPR: [
        o FUNC:                     " params:PARAM_LIST? _ type:('->'|'=>') block:BLOCK? ", (make Func)
        # RIGHT_RECURSIVE
        o OBJ_IMPL:                 " _INDENT? _MARK_COL &:OBJ_IMPL_ITEM+(_COMMA|_NEWLINE _CHECK_COL) ", (make Obj)
        i OBJ_IMPL_ITEM: [
          o                         " _ key:(WORD|STRING|NUMBER) _ ':' _SOFTLINE? value:EXPR ", (make Item)
          o                         " HEREDOC "
        ]
        o ASSIGN:                   " _ target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||='|'or='|'and=') value:BLOCKEXPR ", (make Assign)
        o INVOC_IMPL:               " _ !NUMBER func:(VALUE | 'do') (__|_INDENT (? OBJ_IMPL_ITEM) ) params:ARR_IMPL_ITEM+(_COMMA|_HAD_COMMA _SOFTDENT) ", (make Invocation)

        # COMPLEX
        # NOTE: These can't be the 'left' of an Operation.
        o COMPLEX:                  " (? _COMPLEX_KEYWORD) &:_COMPLEX " # OPTIMIZATION
        i _COMPLEX: [
          o IF:                     " _IF cond:EXPR block:BLOCK ((_NEWLINE|_INDENT)? _ELSE else:BLOCK)? ", (make If)
          o UNLESS:                 " _UNLESS cond:EXPR block:BLOCK ((_NEWLINE|_INDENT)? _ELSE else:BLOCK)? ", (make Unless)
          o FOR:                    " _FOR own:_OWN? __ keys:ASSIGNABLE*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK ", (make For)
          o LOOP:                   " _LOOP block:BLOCK ", (make Loop)
          o WHILE:                  " _WHILE cond:EXPR block:BLOCK ", (make Loop)
          o SWITCH:                 " _SWITCH obj:EXPR _INDENT cases:CASE*_NEWLINE default:DEFAULT? ", (make Switch)
          i CASE:                   " _WHEN matches:EXPR+_COMMA block:BLOCK ", (make Case)
          i DEFAULT:                " _NEWLINE _ELSE BLOCK "
          o TRY:                    " _TRY block:BLOCK
                                      (_NEWLINE? _CATCH catchVar:EXPR? catch:BLOCK?)?
                                      (_NEWLINE? _FINALLY finally:BLOCK)? ", (make Try)
        ]

        # OPERATIONS
        o OP_OPTIMIZATION:          " OP40 _ !/[&\\|\\^=\\!\\<\\>\\+\\-\\*\\/\\%]|(and|or|is|isnt|not|in|instanceof)[^a-zA-Z\\$_0-9]/ " #(OP00_OP|OP02_OP|OP05_OP|OP10_OP|OP20_OP|OP30_OP) "
        o OP00: [
          i OP00_OP:                  " '<<<' | '<<' | '>>' "
          o                           " left:OP00 _ op:OP00_OP _SOFTLINE? right:OP02 ", (make Operation)
          o OP02: [
            i OP02_OP:                " '&&' | '||' | '&' | '|' | '^' | _AND | _OR "
            o                         " left:OP02 _ op:OP02_OP _SOFTLINE? right:OP05 ", (make Operation)
            o OP05: [
              i OP05_OP:              " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
              o                       " left:OP05 _ op:OP05_OP _SOFTLINE? right:OP10 ", (make Operation)
              o OP10: [
                i OP10_OP:            " '+' | '-' "
                o                     " left:OP10 _ op:OP10_OP _SOFTLINE? right:OP20 ", (make Operation)
                o OP20: [
                  i OP20_OP:          " '*' | '/' | '%' "
                  o                   " left:OP20 _ op:OP20_OP _SOFTLINE? right:OP30 ", (make Operation)
                  o OP30: [
                    i OP30_OP:        " _not:_NOT? op:(_IN|_INSTANCEOF) "
                    o                 " left:OP30 _  @:OP30_OP _SOFTLINE? right:OP40 ", (({left, _not, op, right}) ->
                                                                                          invo = new Invocation(func:op, params:[Item(value:left), Item(value:right)])
                                                                                          if _not
                                                                                            return new Not invo
                                                                                          else
                                                                                            return invo)
                    o OP40: [
                      i OP40_OP:      " _NOT | '!' | '~' "
                      o               " _ op:OP40_OP right:OP40 ", (make Operation)
                      o OP45: [
                        i OP45_OP:    " '?' "
                        o             " left:OP45 _ op:OP45_OP _SOFTLINE? right:OP50 ", (make Operation)
                        o OP50: [
                          i OP50_OP:  " '--' | '++' "
                          o           " left:OPATOM op:OP50_OP ", (make Operation)
                          o           " _ op:OP50_OP right:OPATOM ", (make Operation)
                          o OPATOM:   " FUNC | OBJ_IMPL | ASSIGN | INVOC_IMPL | COMPLEX | _ VALUE "
                        ] # end OP50
                      ] # end OP45
                    ] # end OP40
                  ] # end OP30
                ] # end OP20
              ] # end OP10
            ] # end OP05
          ] # end OP02
        ] # end OP00
      ] # end EXPR
    ] # end LINEEXPR
  ] # end LINE

  # ASSIGNABLE
  # TODO I want to do the following,
  #   i ASSIGNABLE:           " SYMBOL | PROPERTY | ASSIGN_LIST | ASSIGN_OBJ | ASSIGNABLE_VALUE "
  # where ASSIGNABLE_VALUE are the assignable left-recursive values like SLIDE or INDEX...
  # This would be more restrictive, and so better in that sense.
  # Taken from the top of src/joeson...
  # > Unfortunately, there is an issue with with the implementation of Joeson where "transient" cached values
  # > like those derived from a loopify iteration, that do not get wiped out of the cache between iterations.
  # > What we want is a way to "taint" the cache results, and wipe all the tainted results...
  # > We could alternatively wipe out all cache items for a given position, but this proved to be
  # > significantly slower.
  i ASSIGNABLE:           " ASSIGN_LIST | ASSIGN_OBJ | VALUE "
  i PARAM_LIST:           " _ '(' &:ASSIGN_LIST_ITEM*_COMMA _ ')' ", (make AssignList)
  i ASSIGN_LIST:          " _ '[' &:ASSIGN_LIST_ITEM*_COMMA _ ']' ", (make AssignList)
  i ASSIGN_LIST_ITEM:     " _ target:(
                              | SYMBOL
                              | PROPERTY
                              | ASSIGN_OBJ
                              | ASSIGN_LIST
                            )
                            splat:'...'?
                            default:(_ '=' LINEEXPR)? ", (make AssignItem)
  i ASSIGN_OBJ:           " _ '{' &:ASSIGN_OBJ_ITEM*_COMMA _ '}'", (make AssignObj)
  i ASSIGN_OBJ_ITEM:      " _ key:(SYMBOL|PROPERTY|NUMBER)
                            target:(_ ':' _ (SYMBOL|PROPERTY|ASSIGN_OBJ|ASSIGN_LIST))?
                            default:(_ '=' LINEEXPR)?", (make AssignItem)

  i VALUE: [
    o " (? VALUE REST) &:LRVALUE "
    i REST: " ( [\\[\\!\\(\\?] | _SOFTLINE? [\\.\\!\\?:] ) "
    # left recursive value
    i LRVALUE: [
      o SLICE:        " obj:VALUE range:RANGE ", (make Slice)
      o INDEX0:       " obj:VALUE type:'['   key:LINEEXPR _ ']' ", (make Index)
      o DELETE0:      " obj:VALUE type:'!['  key:LINEEXPR _ ']' ", (make Index)
      o INDEX1:       " obj:VALUE type:'.' _SOFTLINE?  key:WORD ", (make Index)
      o INDEX2:       " obj:VALUE _SOFTLINE type:'.'   key:WORD ", (make Index)
      o DELETE1:      " obj:VALUE _SOFTLINE? type:'!' !__ key:WORD ", (make Index) # NEW foo.bar!baz  <=> delete foo.bar.baz
      o META:         " obj:VALUE _SOFTLINE? type:'?' !__ key:WORD ", (make Index) # NEW foo.bar?type <=> tyepof foo.bar
      o PROTO:        " obj:VALUE _SOFTLINE? type:'::' key:WORD? ", (make Index)
      o INVOC_EXPL:   " !NUMBER func:VALUE '(' ___ params:ARR_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ ')' ", (make Invocation)
      o SOAK:         " VALUE '?' ", (make Soak)
    ]
    # rest
    o NUMBER:       " /-?[0-9]+(\\.[0-9]+)?/ ", ((it) -> Number it)
    o SPECIAL:      " WORD ", ((word) ->
                      switch word.key
                        when 'yes', 'true', 'on'
                          return yes
                        when 'no', 'false', 'off'
                          return no
                        when 'undefined'
                          return Singleton.undefined
                        when 'null'
                          return Singleton.null
                      return null)
    o SYMBOL:       " !_KEYWORD WORD "
    o TYPEOF:       " _TYPEOF _ VALUE ", ((value) -> new Index obj:value, type:'?', key:Word('type'))
    # starts with symbol
    o ARR_EXPL:     " '[' _SOFTLINE? ARR_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ (',' ___)? ']' ", (make Arr)
    i ARR_EXPL_ITEM: " value:LINEEXPR splat:'...'? ", (make Item)
    i ARR_IMPL_ITEM: " value:EXPR splat:'...'? ", (make Item)
    o RANGE:        " '[' from:LINEEXPR? _ type:('...'|'..') to:LINEEXPR? _ ']' by:(_BY EXPR)? ", (make Range)
    o OBJ_EXPL:     " '{' _SOFTLINE? _MARK_COL &:OBJ_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ '}' ", (make Obj)
    i OBJ_EXPL_ITEM: " _ key:(PROPERTY|WORD|STRING|NUMBER) value:(_ ':' LINEEXPR)? ", (make Item)
    o PROPERTY:     " '@' (WORD|STRING) ", ((key) -> Index obj:Word('this'), key:key)
    o THIS:         " '@' ", (-> Word('this'))
    o PAREN:        " '(' _RESETINDENT BLOCK ___ ')' "
    o STRING: [
      o             " _TQUOTE  (!_TQUOTE  &:(_ESC | _INTERP | .))* _TQUOTE  ", (make Str, dedent:yes)
      o             " _TDQUOTE (!_TDQUOTE &:(_ESC | _INTERP | .))* _TDQUOTE ", (make Str, dedent:yes)
      o             " _DQUOTE  (!_DQUOTE  &:(_ESC | _INTERP | .))* _DQUOTE  ", (make Str)
      o             " _QUOTE   (!_QUOTE   &:(_ESC | .))* _QUOTE             ", (make Str)
      i _ESC:       " _SLASH ", (dontcare, $) ->
                      switch ch=$.code.next()
                        when 'n' then '\n'
                        when 'r' then '\r'
                        when 't' then '\t'
                        when 'b' then '\b'
                        when 'v' then '\u000b'
                        when 'f' then '\f'
                        when '0' then '\0'
                        when 'x' then String.fromCharCode $.code.hex 2
                        when 'u' then String.fromCharCode $.code.hex 4
                        when '\n' then ''
                        else ch
      i _INTERP:    " '\#{' _RESETINDENT BLOCK ___ '}' "
    ]
    o REGEX:        " _FSLASH !__ pattern:(!_FSLASH !_TERM (ESC2 | .))* _FSLASH flags:/[a-zA-Z]*/ ", (make Regex) # TODO
    o NATIVE:       " _BTICK (!_BTICK .)* _BTICK ", (make NativeExpression)
  ]

  # WHITESPACES:
  i _:              " /( |\\\\\\n)*/ ",                  skipLog:yes, ((ws) -> ws.replace /\\\\\\n/g, '')
  i __:             " /( |\\\\\\n)+/ ",                  skipLog:yes, ((ws) -> ws.replace /\\\\\\n/g, '')
  i _TERM:          " _ ('\r\n'|'\n') ",                 skipLog:no
  i _COMMENT:       " _ !HEREDOC '#' (!_TERM .)* ",      skipLog:no
  i _BLANKLINE:     " _COMMENT? _TERM ",                 skipLog:no
  i ___:            " _BLANKLINE* _ ",                   skipLog:yes

  # BLOCKS:
  i BLOCK: [
    o               " _INDENT LINE+_NEWLINE ", (make Block)
    o               " _THEN?  LINE+(_ ';') ", (make Block)
    o               " _INDENTED_COMMENT+ ", (-> new Block [])
    i _INDENTED_COMMENT: " _BLANKLINE ws:_ _COMMENT ", (({ws}, $) ->
                      return null if checkIndent(ws,$) is null
                      return undefined)
  ]
  i BLOCKEXPR:      " _INDENT? EXPR "
  i _INDENT:        " _BLANKLINE+ &:_ ", checkIndent, skipCache:yes
  i _RESETINDENT:   " _BLANKLINE* &:_ ", resetIndent, skipCache:yes
  i _NEWLINE: [
    o _NEWLINE_STRICT: " _BLANKLINE+ &:_ ", checkNewline, skipCache:yes
    o               " _ _SEMICOLON _NEWLINE_STRICT? ", skipCache:yes
  ], skipCache:yes
  i _SOFTLINE:      " _BLANKLINE+ &:_ ", checkSoftline, skipCache:yes
  i _SOFTDENT:      " _BLANKLINE+ &:_ ", checkSoftdent, skipCache:yes
  i _COMMA:         " beforeBlanks:_BLANKLINE* beforeWS:_ ','
                      afterBlanks:_BLANKLINE*  afterWS:_ ", checkComma, skipCache:yes
  i _HAD_COMMA:     " '' ", checkHadComma, skipCache:yes
  i _MARK_COL:      " _ ", markColumn, skipCache:yes
  i _CHECK_COL:     " _ ", checkColumn, skipCache:yes

  # TOKENS:
  i WORD:           " _ /[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/ ", ((key) -> Word key)
  i _KEYWORD:       tokens('if', 'unless', 'else', 'for', 'own', 'in', 'of',
                      'loop', 'while', 'break', 'continue', 'typeof', 'instanceof',
                      'switch', 'when', 'return', 'throw', 'then', 'is', 'isnt', 'by',
                      'not', 'and', 'or', 'try', 'catch', 'finally', 'do',
                      'yes', 'true', 'on', 'no', 'false', 'off', 'undefined', 'null')
  i _COMPLEX_KEYWORD: tokens('if', 'unless', 'for', 'loop', 'while', 'switch', 'try')
  i _BTICK:         " '`'         "
  i _QUOTE:         " '\\''       "
  i _DQUOTE:        " '\"'        "
  i _TQUOTE:        " '\\'\\'\\'' "
  i _TDQUOTE:       " '\"\"\"'    "
  i _FSLASH:        " '/'         "
  i _SLASH:         " '\\\\'      "
  i _SEMICOLON:     " ';'         "
  i '.':            " /[\\s\\S]/ ",                      skipLog:yes
  i ESC1:           " _SLASH . ",                        skipLog:yes
  i ESC2:           " _SLASH . ", ((chr) -> '\\'+chr),   skipLog:yes
]
# ENDGRAMMAR

# Parse the given code
# Usage: parse(inputString, opts)
@parse = ({file, input, opts}) ->
  parsed = GRAMMAR.parse input, opts
  return parsed

# Parse and run code
@run = ({file, input, opts}) ->
  parsed = GRAMMAR.parse input, opts
  jsx = require 'sembly/src/translators/javascript'
  js =  jsx.translate(parsed, {includeHelpers:no, wrapInClosure:no})
  eval(js)
  
# Parse and translate code to javascript.
@translateJavascript = ({file, input, opts}) ->
  parsed = GRAMMAR.parse input, opts
  jsx = require 'sembly/src/translators/javascript'
  return jsx.translate(parsed, {includeHelpers:no, wrapInClosure:no})
