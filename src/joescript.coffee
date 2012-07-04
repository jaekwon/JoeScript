{ clazz,
  colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}
  collections:{Set}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'
{Grammar} = require 'joeson'
{Node} = require 'joeson/src/node'

# Helpers, exported to HELPERS
extend = (dest, source) -> dest.push x for x in source
isVariable = (thing) -> typeof thing is 'string' or thing instanceof Word or thing instanceof Undetermined
@HELPERS = {extend, isVariable}

Word = clazz 'Word', Node, ->
  init: (@key) ->
    switch @key
      when 'undefined'
        @_newOverride = Undefined.undefined
      when 'null'
        @_newOverride = Null.null
  toString: -> @key

# An undetermined variable.
Undetermined = clazz 'Undetermined', Node, ->
  init: (@prefix) ->
  toString: -> "[Undetermined prefix:#{@prefix}]"

Block = clazz 'Block', Node, ->
  children:
    lines:      {type:[type:EXPR]}
  init: (lines) ->
    assert.ok lines, "lines must be defined"
    @lines = if lines instanceof Array then lines else [lines]
  toString: ->
    (''+line for line in @lines).join ';\n'

If = clazz 'If', Node, ->
  children:
    cond:       {type:EXPR, isValue:yes}
    block:      {type:Block, required:yes}
    else:       {type:Block}
  init: ({@cond, @block, @else}) ->
    @block = Block @block if @block not instanceof Block
  toString: ->
    if @else?
      "if(#{@cond}){#{@block}}else{#{@else}}"
    else
      "if(#{@cond}){#{@block}}"

Unless = ({cond, block, _else}) -> If cond:Not(cond), block:block, else:_else

Loop = clazz 'Loop', Node, ->
  children:
    label:      {type:Word}
    cond:       {type:EXPR, isValue:yes}
    block:      {type:Block, required:yes}
  init: ({@label, @cond, @block}) -> @cond ?= true
  toString: -> "while(#{@cond}){#{@block}}"

For = clazz 'For', Loop, ->
  children:
    label:      {type:Word}
    block:      {type:Block}
    keys:       {type:[type:Node]}
    obj:        {type:EXPR, isValue:yes}
    cond:       {type:EXPR, isValue:yes}
  # types:
  #   in: Array / generator iteration,  e.g.  for @keys[0] in @obj {@block}
  #   of: Object key-value iteration,   e.g.  for @keys[0], @keys[1] of @obj {@block}
  init: ({@label, @block, @own, @keys, @type, @obj, @cond}) ->
  toString: -> "for #{@own? and 'own ' or ''}#{@keys.join ','} #{@type} #{@obj} #{@cond? and "when #{@cond} " or ''}{#{@block}}"

# Javascript C-style For-loop
JSForC = clazz 'JSForC', Loop, ->
  children:
    label:      {type:Word}
    block:      {type:Block}
    setup:      {type:Node}
    cond:       {type:EXPR, isValue:yes}
    counter:    {type:Node}
  init: ({@label, @block, @setup, @cond, @counter}) ->
  toString: -> "for (#{@setup or ''};#{@cond or ''};#{@counter or ''}) {#{@block}}"

# Javascript Object Key iteration
JSForK = clazz 'JSForK', Loop, ->
  children:
    label:      {type:Word}
    block:      {type:Block}
    key:        {type:Word}
    obj:        {type:EXPR, isValue:yes}
  init: ({@label, @block, @key, @obj}) ->
  toString: -> "for (#{@key} in #{@obj}) {#{@block}}"

Switch = clazz 'Switch', Node, ->
  children:
    obj:        {type:EXPR, isValue:yes, required:yes}
    cases:      {type:[type:Case]}
    default:    {type:EXPR, isValue:yes}
  init: ({@obj, @cases, @default}) ->
  toString: -> "switch(#{@obj}){#{@cases.join('//')}//else{#{@default}}}"

Try = clazz 'Try', Node, ->
  children:
    block:      {type:Block, required:yes}
    catchVar:   {type:Word}
    catch:      {type:Block}
    finally:    {type:Block}
  init: ({@block, @catchVar, @catch, @finally}) ->
  toString: -> "try {#{@block}}#{
                (@catchVar? or @catch?) and " catch (#{@catchVar or ''}) {#{@catch}}" or ''}#{
                @finally and "finally {#{@finally}}" or ''}"

Case = clazz 'Case', Node, ->
  children:
    matches:    {type:[type:EXPR], required:yes}
    block:      {type:Block}
  init: ({@matches, @block}) ->
  toString: -> "when #{@matches.join ','}{#{@block}}"

Operation = clazz 'Operation', Node, ->
  children:
    left:       {type:EXPR, isValue:yes}
    right:      {type:EXPR, isValue:yes}
  init: ({@left, @op, @right}) ->
  toString: -> "(#{ if @left?  then @left+' '  else ''
                }#{ @op
                }#{ if @right? then ' '+@right else '' })"

Not = (it) -> Operation op:'not', right:it

Statement = clazz 'Statement', Node, ->
  children:
    expr:       {type:EXPR, isValue:yes}
  init: ({@type, @expr}) ->
  toString: -> "#{@type}(#{@expr ? ''});"

Invocation = clazz 'Invocation', Node, ->
  children:
    func:       {type:EXPR, isValue:yes}
    params:     {type:[type:Item,isValue:yes]}
  init: ({@func, @params}) ->
    @type = if ''+@func is 'new' then 'new' # TODO doesnt do anything
  toString: -> "#{@func}(#{@params})"

Assign = clazz 'Assign', Node, ->
  # type: =, +=, -=. *=, /=, ?=, ||= ...
  children:
    target:     {type:Node, required:yes}
    value:      {type:EXPR, isValue:yes, required:yes}
  init: ({@target, type, @op, @value}) ->
    assert.ok @value?, "need value"
    @op = type[...type.length-1] if type?
  toString: -> "#{@target} #{@op or ''}= (#{@value})"

Slice = clazz 'Slice', Node, ->
  children:
    obj:        {type:EXPR, isValue:yes}
    range:      {type:Range, required:yes}
  init: ({@obj, @range}) ->
  toString: -> "#{@obj}[#{@range}]"

Index = clazz 'Index', Node, ->
  children:
    obj:        {type:EXPR, isValue:yes}
    key:        {type:EXPR, isValue:yes}
  init: ({obj, key, type}) ->
    type ?= if key instanceof Word then '.' else '['
    if type is '::'
      if key?
        obj = Index obj:obj, key:'prototype', type:'.'
      else
        key = 'prototype'
      type = '.'
    @obj = obj
    @key = key
    @type = type
  toString: ->
    close = if @type is '[' then ']' else ''
    "#{@obj}#{@type}#{@key}#{close}"

Soak = clazz 'Soak', Node, ->
  children:
    obj:        {type:EXPR, isValue:yes}
  init: (@obj) ->
  toString: -> "(#{@obj})?"

Obj = clazz 'Obj', Node, ->
  children:
    items:      {type:[type:Item]}
  # NOTE Items may contain Heredocs.
  # TODO consider filtering them out or organizing the heredocs
  init: (@items) ->
  toString: -> "{#{if @items? then @items.join ',' else ''}}"

Arr = clazz 'Arr', Obj, ->
  children:
    items:      {type:[type:Item]}
  toString: -> "[#{if @items? then @items.join ',' else ''}]"

Item = clazz 'Item', Node, ->
  children:
    key:        {type:Node}
    value:      {type:EXPR, isValue:yes}
  init: ({@key, @value, @splat}) ->
  toString: ->
    "#{ if @key?              then @key         else ''
    }#{ if @key? and @value?  then ':'          else ''
    }#{ if @value?            then @value       else ''
    }#{ if @splat             then '...'        else '' }"

Null = clazz 'Null', Node, ->
  init: (construct) ->
    if construct isnt yes
      @_newOverride = Null.null
  toString: -> "null"
Null.null = new Null(yes)

Undefined = clazz 'Undefined', Node, ->
  init: (construct) ->
    if construct isnt yes
      @_newOverride = Undefined.undefined
  toString: -> "undefined"
Undefined.undefined = new Undefined(yes)

This = clazz 'This', Node, ->
  init: ->
  toString: -> "@"

Str = clazz 'Str', Node, ->
  children:
    parts:      {type:[type:EXPR, isValue:yes]}
  init: (parts) ->
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

Func = clazz 'Func', Node, ->
  children:
    params:     {type:AssignList}
    block:      {type:Block}
  init: ({@params, @type, @block}) ->
  toString: ->
    "#{ if @params? then '('+@params.toString(no)+')' else '()'
    }#{ @type
    }#{ '{'+@block+'}' }"

AssignObj = clazz 'AssignObj', Node, ->
  children:
    items:      {type:[type:AssignItem]}
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
        "pass" # noitem to do for properties
      else
        throw new Error "Unexpected AssignObj target #{target} (#{target?.constructor.name})"
    return names
  toString: -> "{#{if @items? then @items.join ',' else ''}}"

AssignList = clazz 'AssignList', AssignObj, ->
  children:
    items:    {type:[type:AssignItem]}
  init: (@items) ->
    # need to consider splats.
    # TODO
    for item in @items
      throw new Error "Implement me" if item.splat
  toString: (braces=yes) ->
    "#{ if braces  then '['             else ''
    }#{ if @items? then @items.join ',' else ''
    }#{ if braces  then ']'             else '' }"

AssignItem = clazz 'AssignItem', Node, ->
  children:
    key:      {type:Word}
    target:   {type:Node}
    default:  {type:EXPR, isValue:yes}
  init: ({@key, @target, @default}) ->
  toString: ->
    "#{ if @key?              then @key         else ''
    }#{ if @key? and @target? then ':'          else ''
    }#{ if @target?           then @target      else ''
    }#{ if @splat             then '...'        else ''
    }#{ if @default?          then '='+@default else '' }"

Range = clazz 'Range', Node, ->
  children:
    start:    {type:EXPR, isValue:yes}
    end:      {type:EXPR, isValue:yes}
    by:       {type:EXPR, isValue:yes}
  init: ({@start, @type, @end, @by}) ->
    @by ?= 1
  toString: -> "Range(#{@start? and "start:#{@start}," or ''}"+
                     "#{@end?   and "end:#{@end},"     or ''}"+
                     "type:'#{@type}', by:#{@by})"

NativeExpression = clazz 'NativeExpression', Node, ->
  init: (@exprStr) ->
  toString: -> "`#{@exprStr}`"

Heredoc = clazz 'Heredoc', Node, ->
  init: (@text) ->
  toString: -> "####{@text}###"

Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{@args}}"

@NODES = {
  Node, Word, Block, If, Loop, For, Switch, Try, Case, Operation,
  Statement, Invocation, Assign, Slice, Index, Soak, Obj, This,
  Null, Undefined,
  Arr, Item, Str, Func, Range, NativeExpression, Heredoc, Dummy,
  AssignList, AssignObj, AssignItem,
  Undetermined, JSForC, JSForK
}

trace =
  indent:no

checkIndent = (ws, $) ->
  $.stack[0].indent ?= '' # set default lazily

  container = $.stack[$.stackLength-2]
  $.log "[In] container (@#{$.stackLength-2}:#{container.name}) indent:'#{container.indent}', softline:'#{container.softline}'" if trace.indent
  if container.softline?
    # {
    #   get: -> # begins with a softline
    #   set: ->
    # }
    pIndent = container.softline
  else
    # Get the parent container's indent string
    for i in [$.stackLength-3..0] by -1
      if $.stack[i].softline? or $.stack[i].indent?
        pContainer = $.stack[i]
        pIndent = pContainer.softline ? pContainer.indent
        $.log "[In] parent pContainer (@#{i}:#{pContainer.name}) indent:'#{pContainer.indent}', softline:'#{pContainer.softline}'" if trace.indent
        break
  # If ws starts with pIndent... valid
  if ws.length > pIndent.length and ws.indexOf(pIndent) is 0
    $.log "Setting container.indent to '#{ws}'" if trace.indent
    container.indent = ws
    return container.indent
  null

checkNewline = (ws, $) ->
  # find the container indent (or softline) on the stack
  for i in [$.stackLength-2..0] by -1
    if $.stack[i].softline? or $.stack[i].indent?
      container = $.stack[i]
      break

  containerIndent = container.softline ? container.indent
  isNewline = ws is containerIndent
  $.log "[NL] container (@#{i}:#{container.name}) indent:'#{container.indent}', softline:'#{container.softline}', isNewline:'#{isNewline}'" if trace.indent
  return ws if isNewline
  null

# like a newline, but allows additional padding
checkSoftline = (ws, $) ->
  # find the applicable indent
  container = null
  for i in [$.stackLength-2..0] by -1
    if i < $.stackLength-2 and $.stack[i].softline?
      # a strict ancestor's container's softline acts like an indent.
      # this allows softlines to be shortened only within the same direct container.
      container = $.stack[i]
      $.log "[SL] (@#{i}:#{container.name}) indent(ignored):'#{container.indent}', **softline**:'#{container.softline}'" if trace.indent
      break
    else if $.stack[i].indent?
      container = $.stack[i]
      $.log "[SL] (@#{i}:#{container.name}) **indent**:'#{container.indent}', softline(ignored):'#{container.softline}'" if trace.indent
      break
  assert.ok container isnt null
  # commit softline ws to container
  if ws.indexOf(container.softline ? container.indent) is 0
    topContainer = $.stack[$.stackLength-2]
    $.log "[SL] Setting topmost container (@#{$.stackLength-2}:#{topContainer.name})'s softline to '#{ws}'" if trace.indent
    topContainer.softline = ws
    return ws
  null

checkComma = ({beforeBlanks, beforeWS, afterBlanks, afterWS}, $) ->
  container = $.stack[$.stackLength-2]
  container.trailingComma = yes if afterBlanks?.length > 0 # hack for INVOC_IMPL, see _COMMA_NEWLINE
  if afterBlanks.length > 0
    return null if checkSoftline(afterWS, $) is null
  else if beforeBlanks.length > 0
    return null if checkSoftline(beforeWS, $) is null
  ','

# a kinda newline that can only happen after an initial comma from a common container.
# see _COMMA_NEWLINE
checkCommaNewline = (ws, $) ->
  container = $.stack[$.stackLength-2]
  return null if not container.trailingComma
  # Get the parent container's indent string
  for i in [$.stackLength-3..0] by -1
    if $.stack[i].softline? or $.stack[i].indent?
      pContainer = $.stack[i]
      pIndent = pContainer.softline ? pContainer.indent
      break
  # If ws starts with pIndent... valid
  if ws.length > pIndent.length and ws.indexOf(pIndent) is 0
    return yes
  null

resetIndent = (ws, $) ->
  # find any container
  container = $.stack[$.stackLength-2]
  assert.ok container?
  $.log "setting container(=#{container.name}).indent to '#{ws}'" if trace.indent
  container.indent = ws
  return container.indent

@GRAMMAR = GRAMMAR = Grammar ({o, i, tokens, make}) -> [
  o                                 " _SETUP _BLANKLINE* LINES ___ "
  i _SETUP:                         " '' ", (dontcare, $) -> $.stack[0].indent = ''
  i LINES:                          " LINE*_NEWLINE _ _SEMICOLON? ", make Block
  i LINE: [
    o HEREDOC:                      " _ '###' !'#' (!'###' .)* '###' ", (it) -> Heredoc it.join ''
    o LINEEXPR: [
      # left recursive
      o POSTIF:                     " block:LINEEXPR _IF cond:EXPR ", make If
      o POSTUNLESS:                 " block:LINEEXPR _UNLESS cond:EXPR ", make Unless
      o POSTFOR:                    " block:LINEEXPR _FOR own:_OWN? __ keys:ASSIGNABLE*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? ", make For
      o POSTWHILE:                  " block:LINEEXPR _WHILE cond:EXPR ", make Loop
      # rest
      o STMT:                       " type:(_RETURN|_THROW|_BREAK|_CONTINUE) expr:EXPR? ", make Statement
      o EXPR: [
        o FUNC:                     " params:PARAM_LIST? _ type:('->'|'=>') block:BLOCK? ", make Func
        # RIGHT_RECURSIVE
        o OBJ_IMPL:                 " _INDENT? &:OBJ_IMPL_ITEM+(_COMMA|_NEWLINE) ", make Obj
        i OBJ_IMPL_ITEM: [
          o                         " _ key:(WORD|STRING|NUMBER) _ ':' _SOFTLINE? value:EXPR ", make Item
          o                         " HEREDOC "
        ]
        o ASSIGN:                   " _ target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||='|'or='|'and=') value:BLOCKEXPR ", make Assign
        o INVOC_IMPL:               " _ func:VALUE (__|_INDENT (? OBJ_IMPL_ITEM) ) params:ARR_IMPL_ITEM+(_COMMA|_COMMA_NEWLINE) ", make Invocation

        # COMPLEX
        o COMPLEX:                  " (? _KEYWORD) &:_COMPLEX " # OPTIMIZATION
        i _COMPLEX: [
          o IF:                     " _IF cond:EXPR block:BLOCK ((_NEWLINE|_INDENT)? _ELSE else:BLOCK)? ", make If
          o UNLESS:                 " _UNLESS cond:EXPR block:BLOCK ((_NEWLINE|_INDENT)? _ELSE else:BLOCK)? ", make Unless
          o FOR:                    " _FOR own:_OWN? __ keys:ASSIGNABLE*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK ", make For
          o LOOP:                   " _LOOP block:BLOCK ", make Loop
          o WHILE:                  " _WHILE cond:EXPR block:BLOCK ", make Loop
          o SWITCH:                 " _SWITCH obj:EXPR _INDENT cases:CASE*_NEWLINE default:DEFAULT? ", make Switch
          i CASE:                   " _WHEN matches:EXPR+_COMMA block:BLOCK ", make Case
          i DEFAULT:                " _NEWLINE _ELSE BLOCK "
          o TRY:                    " _TRY block:BLOCK
                                      (_NEWLINE? _CATCH catchVar:EXPR? catch:BLOCK?)?
                                      (_NEWLINE? _FINALLY finally:BLOCK)? ", make Try
        ]

        # OPERATIONS
        o OP_OPTIMIZATION:          " OP40 _ !/[&\\|\\^=\\!\\<\\>\\+\\-\\*\\/\\%]|(and|or|is|isnt|not|in|instanceof)[^a-zA-Z\\$_0-9]/ " #(OP00_OP|OP05_OP|OP10_OP|OP20_OP|OP30_OP) "
        o OP00: [
          i OP00_OP:                " '&&' | '||' | '&' | '|' | '^' | _AND | _OR "
          o                         " left:OP00 _ op:OP00_OP _SOFTLINE? right:OP05 ", make Operation
          o OP05: [
            i OP05_OP:              " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
            o                       " left:OP05 _ op:OP05_OP _SOFTLINE? right:OP10 ", make Operation
            o OP10: [
              i OP10_OP:            " '+' | '-' "
              o                     " left:OP10 _ op:OP10_OP _SOFTLINE? right:OP20 ", make Operation
              o OP20: [
                i OP20_OP:          " '*' | '/' | '%' "
                o                   " left:OP20 _ op:OP20_OP _SOFTLINE? right:OP30 ", make Operation
                o OP30: [
                  i OP30_OP:        " _not:_NOT? op:(_IN|_INSTANCEOF) "
                  o                 " left:OP30 _  @:OP30_OP _SOFTLINE? right:OP40 ", ({left, _not, op, right}) ->
                                                                                                invo = new Invocation(func:op, params:[left, right])
                                                                                                if _not
                                                                                                  return new Not invo
                                                                                                else
                                                                                                  return invo
                  o OP40: [
                    i OP40_OP:      " _NOT | '!' | '~' "
                    o               " _ op:OP40_OP right:OP40 ", make Operation
                    o OP45: [
                      i OP45_OP:    " '?' "
                      o             " left:OP45 _ op:OP45_OP _SOFTLINE? right:OP50 ", make Operation
                      o OP50: [
                        i OP50_OP:  " '--' | '++' "
                        o           " left:OPATOM op:OP50_OP ", make Operation
                        o           " _ op:OP50_OP right:OPATOM ", make Operation
                        o OPATOM:   " FUNC | OBJ_IMPL | ASSIGN | INVOC_IMPL | COMPLEX | _ VALUE "
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
  i PARAM_LIST:           " _ '(' &:ASSIGN_LIST_ITEM*_COMMA _ ')' ", make AssignList
  i ASSIGN_LIST:          " _ '[' &:ASSIGN_LIST_ITEM*_COMMA _ ']' ", make AssignList
  i ASSIGN_LIST_ITEM:     " _ target:(
                              | SYMBOL
                              | PROPERTY
                              | ASSIGN_OBJ
                              | ASSIGN_LIST
                            )
                            splat:'...'?
                            default:(_ '=' LINEEXPR)? ", make AssignItem
  i ASSIGN_OBJ:           " _ '{' &:ASSIGN_OBJ_ITEM*_COMMA _ '}'", make AssignObj
  i ASSIGN_OBJ_ITEM:      " _ key:(SYMBOL|PROPERTY|NUMBER)
                            target:(_ ':' _ (SYMBOL|PROPERTY|ASSIGN_OBJ|ASSIGN_LIST))?
                            default:(_ '=' LINEEXPR)?", make AssignItem

  i VALUE: [
    # left recursive
    o SLICE:        " obj:VALUE range:RANGE ", make Slice
    o INDEX0:       " obj:VALUE type:'['  key:LINEEXPR _ ']' ", make Index
    o INDEX1:       " obj:VALUE _SOFTLINE? type:'.'  key:WORD ", make Index
    o PROTO:        " obj:VALUE _SOFTLINE? type:'::' key:WORD? ", make Index
    o INVOC_EXPL:   " func:VALUE '(' ___ params:ARR_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ ')' ", make Invocation
    o SOAK:         " VALUE '?' ", make Soak

    # rest
    o NUMBER:       " /-?[0-9]+(\\.[0-9]+)?/ ", make Number
    o SYMBOL:       " !_KEYWORD WORD "
    o BOOLEAN:      " _TRUE | _FALSE ", (it) -> it is 'true'
    o TYPEOF: [
      o             " func:_TYPEOF '(' ___ params:LINEEXPR{1,1} ___ ')' ", make Invocation
      o             " func:_TYPEOF __ params:LINEEXPR{1,1} ", make Invocation
    ]
    # starts with symbol
    o ARR_EXPL:     " '[' _SOFTLINE? ARR_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ (',' ___)? ']' ", make Arr
    i ARR_EXPL_ITEM: " value:LINEEXPR splat:'...'? ", make Item
    i ARR_IMPL_ITEM: " value:EXPR splat:'...'? ", make Item
    o RANGE:        " '[' start:LINEEXPR? _ type:('...'|'..') end:LINEEXPR? _ ']' by:(_BY EXPR)? ", make Range
    o OBJ_EXPL:     " '{' _SOFTLINE? &:OBJ_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ '}' ", make Obj
    i OBJ_EXPL_ITEM: " _ key:(PROPERTY|WORD|STRING|NUMBER) value:(_ ':' LINEEXPR)? ", make Item
    o PROPERTY:     " '@' (WORD|STRING) ", (key) -> Index obj:This(), key:key
    o THIS:         " '@' ", make This
    o PAREN:        " '(' _RESETINDENT BLOCK ___ ')' "
    o STRING: [
      o             " _TQUOTE  (!_TQUOTE  &:(_ESCSTR | _INTERP | .))* _TQUOTE  ", make Str
      o             " _TDQUOTE (!_TDQUOTE &:(_ESCSTR | _INTERP | .))* _TDQUOTE ", make Str
      o             " _DQUOTE  (!_DQUOTE  &:(_ESCSTR | _INTERP | .))* _DQUOTE  ", make Str
      o             " _QUOTE   (!_QUOTE   &:(_ESCSTR | .))* _QUOTE            ", make Str
      i _ESCSTR:    " _SLASH . ", (it) -> {n:'\n', t:'\t', r:'\r'}[it] or it
      i _INTERP:    " '\#{' _RESETINDENT BLOCK ___ '}' "
    ]
    o REGEX:        " _FSLASH !__ &:(!_FSLASH !_TERM (ESC2 | .))* _FSLASH flags:/[a-zA-Z]*/ ", make Str
    o NATIVE:       " _BTICK (!_BTICK .)* _BTICK ", make NativeExpression
  ]

  # WHITESPACES:
  i _:              " /( |\\\\\\n)*/ ",                  skipLog:yes, (ws) -> ws.replace /\\\\\\n/g, ''
  i __:             " /( |\\\\\\n)+/ ",                  skipLog:yes, (ws) -> ws.replace /\\\\\\n/g, ''
  i _TERM:          " _ ('\r\n'|'\n') ",                 skipLog:no
  i _COMMENT:       " _ !HEREDOC '#' (!_TERM .)* ",      skipLog:no
  i _BLANKLINE:     " _COMMENT? _TERM ",                 skipLog:no
  i ___:            " _BLANKLINE* _ ",                   skipLog:yes

  # BLOCKS:
  i BLOCK: [
    o               " _INDENT LINE+_NEWLINE ", make Block
    o               " _THEN?  LINE+(_ ';') ", make Block
    o               " _INDENTED_COMMENT+ ", -> new Block []
    i _INDENTED_COMMENT: " _BLANKLINE ws:_ _COMMENT ", ({ws}, $) ->
                      return null if checkIndent(ws,$) is null
                      return undefined
  ]
  i BLOCKEXPR:      " _INDENT? EXPR "
  i _INDENT:        " _BLANKLINE+ &:_ ", checkIndent, skipCache:yes
  i _RESETINDENT:   " _BLANKLINE* &:_ ", resetIndent, skipCache:yes
  i _NEWLINE: [
    o _NEWLINE_STRICT: " _BLANKLINE+ &:_ ", checkNewline, skipCache:yes
    o               " _ _SEMICOLON _NEWLINE_STRICT? ", skipCache:yes
  ], skipCache:yes
  i _SOFTLINE:      " _BLANKLINE+ &:_ ", checkSoftline, skipCache:yes
  i _COMMA:         " beforeBlanks:_BLANKLINE* beforeWS:_ ','
                      afterBlanks:_BLANKLINE*  afterWS:_ ", checkComma, skipCache:yes
  i _COMMA_NEWLINE: " _BLANKLINE+ &:_ ", checkCommaNewline, skipCache:yes

  # TOKENS:
  i WORD:           " _ /[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/ ", make Word
  i _KEYWORD:       tokens('if', 'unless', 'else', 'for', 'own', 'in', 'of',
                      'loop', 'while', 'break', 'continue',
                      'switch', 'when', 'return', 'throw', 'then', 'is', 'isnt', 'true', 'false', 'by',
                      'not', 'and', 'or', 'instanceof', 'typeof', 'try', 'catch', 'finally')
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

# NODE TYPE GROUPS
EXPR = new Set([Node, Boolean, String, Number])

# Parse the given code
@parse = GRAMMAR.parse
