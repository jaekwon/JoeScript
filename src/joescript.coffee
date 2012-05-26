{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'
_         = require 'underscore'
fs        = require 'fs'
path      = require 'path'
{Grammar} = require 'joeson'

# Helpers, exported to HELPERS
extend = (dest, source) -> dest.push x for x in source
isWord = (thing) -> thing instanceof Word or typeof thing is 'string'
isVariable = (thing) -> isWord thing or thing instanceof Undetermined
@HELPERS = {extend, isWord, isVariable}

indent = (indent) -> Array(indent+1).join('  ')

# All AST nodes are instances of Node.
Node = clazz 'Node', ->

  validateType = (obj, descriptor) ->
    switch descriptor.type
      when Node
        if typeof obj is 'object'
          if obj not instanceof Node
            throw new Error "Expected an instanceof Node (or primary object)"
      when Array, String
        if obj? and obj not instanceof descriptor.type
          throw new Error "Expected an instanceof #{descriptor.type.constructor.name}"
      when 'string'
        if typeof obj isnt 'string'
          throw new Error "Expected typeof string"
      else return yes # nothing to do
  
  # Iterate cb function over all child attributes.
  # cb:   (child, parent, attrName, descriptor, index?) -> ...
  withChildren: (cb, options) ->
    assert.ok not options?, "options have been deprecated. reimplement me"
    for attr, desc of @children||{}
      value = this[attr]
      if desc instanceof Array
        assert.ok value instanceof Array, "Expected (#{this})[#{red attr}] to be an Array"
        for item, i in value when item?
          cb(item, this, attr, desc[0], i)
      else if value?
        cb(value, this, attr, desc)

  # Validate types recursively for all children
  validate: ->
    withChildren: (child, parent, attr, desc) -> validateType child, desc

  # e.g.
  # Block::defineProperty('foo', get: -> 'FOO')
  # Block().foo is 'FOO'
  defineProperty: (name, data) -> Object.defineProperty @, name, data

  serialize: (_indent=0) ->
    valueStr = if isWord this
        ''+this
      else if typeof this in ['number', 'string', 'boolean']
        ''+this
      else
        ''
    str = "#{green @constructor.name} #{valueStr}\n"
    @withChildren (child, parent, attr, desc) ->
      str += "#{indent _indent+1}#{red "@"+attr}: " ##{blue inspect desc}\n"
      if child.serialize?
        str += "#{child.serialize(_indent+1)}\n"
      else
        str += "#{''+child} #{"("+child.constructor.name+")"}\n"
    return str.trimRight()

Word = clazz 'Word', Node, ->
  init: (@word) ->
    switch @word
      when 'undefined'
        @_newOverride = Undefined.undefined
      when 'null'
        @_newOverride = Null.null
  toString: -> @word

# An undetermined variable.
Undetermined = clazz 'Undetermined', Node, ->
  init: (@prefix) ->
  word$:
    get: -> throw new Error "Name of Undetermined not yet determined!" unless @_word?
    set: (@_word) ->

Block = clazz 'Block', Node, ->
  children:
    lines:      [{type:Node}]
  init: (lines) ->
    @lines = if lines instanceof Array then lines else [lines]
  toString: ->
    (''+line for line in @lines).join ';\n'

If = clazz 'If', Node, ->
  children:
    cond:       {type:Node, value:yes}
    block:      {type:Node}
    elseBlock:  {type:Node}
  init: ({@cond, @block, @elseBlock}) ->
    @block = Block @block if @block not instanceof Block
  toString: ->
    if @elseBlock?
      "if(#{@cond}){#{@block}}else{#{@elseBlock}}"
    else
      "if(#{@cond}){#{@block}}"

Unless = ({cond, block, elseBlock}) -> If cond:Not(cond), block:block, elseBlock:elseBlock

Loop = clazz 'Loop', Node, ->
  children:
    label:      {type:Word}
    cond:       {type:Node, value:yes}
    block:      {type:Node}
  init: ({@label, @cond, @block}) -> @cond ?= true
  toString: -> "while(#{@cond}){#{@block}}"

For = clazz 'For', Loop, ->
  children:
    label:      {type:Word}
    block:      {type:Node}
    keys:      [{type:Node}]
    obj:        {type:Node, value:yes}
    cond:       {type:Node, value:yes}
  # types:
  #   in: Array / generator iteration,  e.g.  for @keys[0] in @obj {@block}
  #   of: Object key-value iteration,   e.g.  for @keys[0], @keys[1] of @obj {@block}
  init: ({@label, @block, @own, @keys, @type, @obj, @cond}) ->
  toString: -> "for #{@own? and 'own ' or ''}#{@keys.join ','} #{@type} #{@obj} #{@cond? and "when #{@cond} " or ''}{#{@block}}"

# Javascript C-style For-loop
JSForC = clazz 'JSForC', Loop, ->
  children:
    label:      {type:Word}
    block:      {type:Node}
    setup:      {type:Node}
    cond:       {type:Node, value:yes}
    counter:    {type:Node}
  init: ({@label, @block, @setup, @cond, @counter}) ->
  toString: -> "for (#{@setup or ''};#{@cond or ''};#{@counter or ''}) {#{@block}}"

# Javascript Object Key iteration
JSForK = clazz 'JSForK', Loop, ->
  children:
    label:      {type:Word}
    block:      {type:Node}
    key:        {type:Word}
    obj:        {type:Node, value:yes}
  init: ({@label, @block, @key, @obj}) ->
  toString: -> "for (#{@key} in #{@obj}) {#{@block}}"

Switch = clazz 'Switch', Node, ->
  children:
    obj:        {type:Node, value:yes}
    cases:     [{type:Case}]
    default:    {type:Node}
  init: ({@obj, @cases, @default}) ->
  toString: -> "switch(#{@obj}){#{@cases.join('//')}//else{#{@default}}}"

Try = clazz 'Try', Node, ->
  children:
    block:      {type:Node}
    catchVar:   {type:Word}
    catchBlock: {type:Node}
    finally:    {type:Node}
  init: ({@block, @catchVar, @catchBlock, @finally}) ->
  toString: -> "try {#{@block}}#{
                (@catchVar? or @catchBlock?) and " catch (#{@catchVar or ''}) {#{@catchBlock}}" or ''}#{
                @finally and "finally {#{@finally}}" or ''}"

Case = clazz 'Case', Node, ->
  children:
    matches:   [{type:Node}]
    block:      {type:Node}
  init: ({@matches, @block}) ->
  toString: -> "when #{@matches.join ','}{#{@block}}"

Operation = clazz 'Operation', Node, ->
  children:
    left:       {type:Node, value:yes}
    right:      {type:Node, value:yes}
  init: ({@left, @op, @right}) ->
  toString: -> "(#{ if @left?  then @left+' '  else ''
                }#{ @op
                }#{ if @right? then ' '+@right else '' })"

Not = (it) -> Operation op:'not', right:it

Statement = clazz 'Statement', Node, ->
  children:
    expr:       {type:Node, value:yes}
  init: ({@type, @expr}) ->
  toString: -> "#{@type}(#{@expr ? ''});"

Invocation = clazz 'Invocation', Node, ->
  children:
    func:       {type:Node, value:yes}
    params:    [{type:Node, value:yes}]
  init: ({@func, @params}) ->
    @type = if isWord(@func) and ''+@func is 'new' then 'new' else undefined
  toString: -> "#{@func}(#{@params.map((p)->"#{p}#{p.splat and '...' or ''}")})"

Assign = clazz 'Assign', Node, ->
  # type: =, +=, -=. *=, /=, ?=, ||= ...
  children:
    target:     {type:Node}
    value:      {type:Node, value:yes}
  init: ({@target, type, @op, @value}) ->
    @op = type[...type.length-1] if type?
  toString: -> "#{@target} #{@op or ''}= (#{@value})"

Slice = clazz 'Slice', Node, ->
  children:
    obj:        {type:Node, value:yes}
    range:      {type:Range}
  init: ({@obj, @range}) ->
  toString: -> "#{@obj}[#{@range}]"

Index = clazz 'Index', Node, ->
  children:
    obj:        {type:Node, value:yes}
    attr:       {type:Node, value:yes}
  init: ({obj, attr, type}) ->
    type ?= if isWord attr then '.' else '['
    if type is '::'
      if attr?
        obj = Index obj:obj, attr:'prototype', type:'.'
      else
        attr = 'prototype'
      type = '.'
    @obj = obj
    @attr = attr
    @type = type
  toString: ->
    close = if @type is '[' then ']' else ''
    "#{@obj}#{@type}#{@attr}#{close}"

Soak = clazz 'Soak', Node, ->
  children:
    obj:        {type:Node, value:yes}
  init: (@obj) ->
  toString: -> "(#{@obj})?"

Obj = clazz 'Obj', Node, ->
  children:
    items:     [{type:Item}]
  init: (@items) ->
  toString: -> "{#{if @items? then @items.join ',' else ''}}"

Null = clazz 'Null', Node, ->
  init: (construct) ->
    if construct isnt yes
      @_newOverride = Null.null
  value: null
  toString: -> "null"
Null.null = new Null(yes)

Undefined = clazz 'Undefined', Node, ->
  init: (construct) ->
    if construct isnt yes
      @_newOverride = Undefined.undefined
  value: undefined
  toString: -> "undefined"
Undefined.undefined = new Undefined(yes)

This = clazz 'This', Node, ->
  init: ->
  toString: -> "@"

Arr = clazz 'Arr', Obj, ->
  children:
    items:     [{type:Item}]
  toString: -> "[#{if @items? then @items.join ',' else ''}]"

Item = clazz 'Item', Node, ->
  children:
    key:        {type:Node}
    value:      {type:Node, value:yes}
  init: ({@key, @value}) ->
  toString: -> @key+(if @value?   then ":(#{@value})"   else '')

Str = clazz 'Str', Node, ->
  children:
    parts:     [{type:Object, value:yes}]
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
  children:
    params:     {type:AssignList}
    block:      {type:Node}
  init: ({@params, @type, @block}) ->
    @block ?= Block()
  toString: ->
    "#{ if @params? then '('+@params.toString(no)+')' else '()'
    }#{ @type
    }#{ '{'+@block+'}' }"

AssignObj = clazz 'AssignObj', Node, ->
  children:
    items:      {type:AssignItem}
  init: (@items) ->
  targetNames$: get: ->
    names = []
    for item in @items
      target = item.target ? item.key
      if isWord target
        names.push target
      else if target instanceof AssignObj
        extend names, target.targetNames
      else if target instanceof Index
        "pass" # noitem to do for properties
      else
        throw new Error "Unexpected assign target #{target} (#{target.constructor.name})"
    return names

  # source:   The source for destructuring assignment
  # block:    The block into which assignment nodes will be appended
  #           Created and prepared with its own scope, if undefined.
  # returns the block.
  toBlock: (source, block) ->
    if not block?
      block = Block([])
    for item, i in @items
      target   = item.target ? item.key
      key      = item.key ? i
      default_ = item.default
      if isWord target or target instanceof Index
        block.lines.push Assign target:target, value:Index(source, key)
        block.lines.push Assign target:target, value:default_, type:'?='
      else if target instanceof AssignObj
        temp = Undetermined '_assign'
        block.lines.push Assign target:temp, value:Index(source, key)
        block.lines.push Assign target:temp, value:default_, type:'?='
        target.toBlock temp, block
      else
        throw new Error "Unexpected assign target #{target} (#{target.constructor.name})"
    return block
    
  toString: -> "{#{if @items? then @items.join ',' else ''}}"

AssignList = clazz 'AssignList', AssignObj, ->
  toString: (braces=yes) ->
    "#{ if braces  then '['             else ''
    }#{ if @items? then @items.join ',' else ''
    }#{ if braces  then ']'             else '' }"

AssignItem = clazz 'AssignItem', Node, ->
  children:
    key:      {type:Word}
    target:   {type:Node}
    default:  {type:Node, value:yes}
  init: ({@key, @target, @default}) ->
  toString: ->
    "#{ if @key?              then @key         else ''
    }#{ if @key? and @target? then ':'          else ''
    }#{ if @target?           then @target      else ''
    }#{ if @splat             then '...'        else ''
    }#{ if @default?          then '='+@default else '' }"

Range = clazz 'Range', Node, ->
  children:
    start:    {type:Node, value:yes}
    end:      {type:Node, value:yes}
    by:       {type:Node, value:yes}
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

debugIndent = yes

checkIndent = (ws) ->
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
  @stack[0].indent ?= '' # set default lazily

  # find the container indent (or softline) on the stack
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
  assert.ok container isnt null
  # commit softline ws to container
  if ws.indexOf(container.softline ? container.indent) is 0
    topContainer = @stack[@stack.length-2]
    @log "[SL] Setting topmost container (@#{@stack.length-2}:#{topContainer.name})'s softline to '#{ws}'"
    topContainer.softline = ws
    return ws
  null

checkComma = ({beforeBlanks, beforeWS, afterBlanks, afterWS}) ->
  container = @stack[@stack.length-2]
  container.trailingComma = yes if afterBlanks?.length > 0 # hack for INVOC_IMPL, see _COMMA_NEWLINE
  if afterBlanks.length > 0
    return null if checkSoftline.call(this, afterWS) is null
  else if beforeBlanks.length > 0
    return null if checkSoftline.call(this, beforeWS) is null
  ','

checkCommaNewline = (ws) ->
  @stack[0].indent ?= '' # set default lazily
  container = @stack[@stack.length-2]
  return null if not container.trailingComma
  # Get the parent container's indent string
  for i in [@stack.length-3..0] by -1
    if @stack[i].softline? or @stack[i].indent?
      pContainer = @stack[i]
      pIndent = pContainer.softline ? pContainer.indent
      break
  # If ws starts with pIndent... valid
  if ws.length > pIndent.length and ws.indexOf(pIndent) is 0
    return yes
  null

resetIndent = (ws) ->
  @stack[0].indent ?= '' # set default lazily
  # find any container
  container = @stack[@stack.length-2]
  assert.ok container?
  @log "setting container(=#{container.name}).indent to '#{ws}'"
  container.indent = ws
  return container.indent

@GRAMMAR = GRAMMAR = Grammar ({o, i, tokens}) -> [
  o                                 " _BLANKLINE* LINES ___ "
  i LINES:                          " LINE*(_NEWLINE | _ _SEMICOLON) ", Block
  i LINE: [
    o HEREDOC:                      " _ '###' !'#' (!'###' .)* '###' ", (it) -> Heredoc it.join ''
    o LINEEXPR: [
      # left recursive
      o POSTIF:                     " block:LINEEXPR _IF cond:EXPR ", If
      o POSTUNLESS:                 " block:LINEEXPR _UNLESS cond:EXPR ", Unless
      o POSTFOR:                    " block:LINEEXPR _FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? ", For
      o POSTWHILE:                  " block:LINEEXPR _WHILE cond:EXPR ", Loop
      # rest
      o STMT:                       " type:(_RETURN|_THROW|_BREAK|_CONTINUE) expr:EXPR? ", Statement
      o EXPR: [
        o FUNC:                     " params:PARAM_LIST? _ type:('->'|'=>') block:BLOCK? ", Func
        i PARAM_LIST:               " _ '(' ASSIGN_LIST_ITEM*_COMMA _ ')' ", AssignList
        i ASSIGN_LIST:              " _ '[' ASSIGN_LIST_ITEM*_COMMA _ ']' ", AssignList
        i ASSIGN_LIST_ITEM:         " target:(
                                        | &:SYMBOL   splat:'...'?
                                        | &:PROPERTY splat:'...'?
                                        | ASSIGN_OBJ
                                        | ASSIGN_LIST
                                      )
                                      default:(_ '=' LINEEXPR)? ", AssignItem
        i ASSIGN_OBJ:               " _ '{' ASSIGN_OBJ_ITEM*_COMMA _ '}'", AssignObj
        i ASSIGN_OBJ_ITEM:          " key:(SYMBOL|PROPERTY)
                                      target:(_ ':' (SYMBOL|PROPERTY|ASSIGN_OBJ|ASSIGN_LIST))?
                                      default:(_ '=' LINEEXPR)?", AssignItem
        o RIGHT_RECURSIVE: [
          o INVOC_IMPL:             " func:ASSIGNABLE (? __|OBJ_IMPL_INDENTED) params:(&:EXPR splat:'...'?)+(_COMMA | _COMMA_NEWLINE) ", Invocation
          i OBJ_IMPL_INDENTED:      " _INDENT OBJ_IMPL_ITEM+(_COMMA|_NEWLINE) ", Obj
          o OBJ_IMPL:               " _INDENT? OBJ_IMPL_ITEM+(_COMMA|_NEWLINE) ", Obj
          i OBJ_IMPL_ITEM:          " key:(WORD|STRING) _ ':' _SOFTLINE? value:EXPR ", Item
          o ASSIGN:                 " target:ASSIGNABLE _ type:('='|'+='|'-='|'*='|'/='|'?='|'||='|'or='|'and=') value:BLOCKEXPR ", Assign
        ]
        o COMPLEX: [
          o IF:                     " _IF cond:EXPR block:BLOCK ((_NEWLINE | _INDENT)? _ELSE elseBlock:BLOCK)? ", If
          o UNLESS:                 " _UNLESS cond:EXPR block:BLOCK ((_NEWLINE | _INDENT)? _ELSE elseBlock:BLOCK)? ", Unless
          o FOR:                    " _FOR own:_OWN? keys:SYMBOL*_COMMA{1,2} type:(_IN|_OF) obj:EXPR (_WHEN cond:EXPR)? block:BLOCK ", For
          o LOOP:                   " _LOOP block:BLOCK ", Loop
          o WHILE:                  " _WHILE cond:EXPR block:BLOCK ", Loop
          o SWITCH:                 " _SWITCH obj:EXPR _INDENT cases:CASE*_NEWLINE default:DEFAULT? ", Switch
          i CASE:                   " _WHEN matches:EXPR+_COMMA block:BLOCK ", Case
          i DEFAULT:                " _NEWLINE _ELSE BLOCK "
          o TRY:                    " _TRY block:BLOCK
                                      (_NEWLINE? _CATCH catchVar:EXPR? catchBlock:BLOCK?)?
                                      (_NEWLINE? _FINALLY finally:BLOCK)? ", Try
        ]
        o OP_OPTIMIZATION:          " OP40 _ !(OP00_OP|OP05_OP|OP10_OP|OP20_OP|OP30_OP) "
        o OP00: [
          i OP00_OP:                " '&&' | '||' | '&' | '|' | '^' | _AND | _OR "
          o                         " left:(OP00|OP05) _ op:OP00_OP _SOFTLINE? right:OP05 ", Operation
          o OP05: [
            i OP05_OP:              " '==' | '!=' | '<=' | '<' | '>=' | '>' | _IS | _ISNT "
            o                       " left:(OP05|OP10) _ op:OP05_OP _SOFTLINE? right:OP10 ", Operation
            o OP10: [
              i OP10_OP:            " '+' | '-' "
              o                     " left:(OP10|OP20) _ op:OP10_OP _SOFTLINE? right:OP20 ", Operation
              o OP20: [
                i OP20_OP:          " '*' | '/' | '%' "
                o                   " left:(OP20|OP30) _ op:OP20_OP _SOFTLINE? right:OP30 ", Operation
                o OP30: [
                  i OP30_OP:        " _not:_NOT? op:(_IN|_INSTANCEOF) "
                  o                 " left:(OP30|OP40) _  @:OP30_OP _SOFTLINE? right:OP40 ", ({left, _not, op, right}) ->
                                                                                                invo = Invocation(func:op, params:[left, right])
                                                                                                if _not
                                                                                                  return Not(invo)
                                                                                                else
                                                                                                  return invo
                  o OP40: [
                    i OP40_OP:      " _NOT | '!' | '~' "
                    o               " _ op:OP40_OP right:OP40 ", Operation
                    o OP45: [
                      i OP45_OP:    " '?' "
                      o             " left:(OP45|OP50) _ op:OP45_OP _SOFTLINE? right:OP50 ", Operation
                      o OP50: [
                        i OP50_OP:  " '--' | '++' "
                        o           " left:OPATOM op:OP50_OP ", Operation
                        o           " _ op:OP50_OP right:OPATOM ", Operation
                        o OPATOM:   " FUNC | RIGHT_RECURSIVE | COMPLEX | ASSIGNABLE "
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
    o SLICE:        " obj:ASSIGNABLE !__ range:RANGE ", Slice
    o INDEX0:       " obj:ASSIGNABLE type:'['  attr:LINEEXPR _ ']' ", Index
    o INDEX1:       " obj:ASSIGNABLE type:'.'  attr:WORD ", Index
    o PROTO:        " obj:ASSIGNABLE type:'::' attr:WORD? ", Index
    o INVOC_EXPL:   " func:ASSIGNABLE '(' ___ params:(&:LINEEXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ ')' ", Invocation
    o SOAK:         " ASSIGNABLE '?' ", Soak
    # rest
    o TYPEOF: [
      o             " func:_TYPEOF '(' ___ params:LINEEXPR{1,1} ___ ')' ", Invocation
      o             " func:_TYPEOF __ params:LINEEXPR{1,1} ", Invocation
    ]
    o RANGE:        " _ '[' start:LINEEXPR? _ type:('...'|'..') end:LINEEXPR? _ ']' by:(_BY EXPR)? ", Range
    o ARR_EXPL:     " _ '[' _SOFTLINE? (&:LINEEXPR splat:'...'?)*(_COMMA|_SOFTLINE) ___ (',' ___)? ']' ", Arr
    o OBJ_EXPL:     " _ '{' _SOFTLINE? OBJ_EXPL_ITEM*(_COMMA|_SOFTLINE) ___ '}' ", Obj
    i OBJ_EXPL_ITEM: " key:(PROPERTY|WORD|STRING) value:(_ ':' LINEEXPR)? ", Item
    o PAREN:        " _ '(' _RESETINDENT BLOCK ___ ')' "
    o PROPERTY:     " _ '@' (WORD|STRING) ", (attr) -> Index obj:This(), attr:attr
    o THIS:         " _ '@' ", This
    o REGEX:        " _ _FSLASH !__ &:(!_FSLASH !_TERM (ESC2 | .))* _FSLASH flags:/[a-zA-Z]*/ ", Str
    o STRING: [
      o             " _ _TQUOTE  (!_TQUOTE  (ESCSTR | INTERP | .))* _TQUOTE  ", Str
      o             " _ _TDQUOTE (!_TDQUOTE (ESCSTR | INTERP | .))* _TDQUOTE ", Str
      o             " _ _DQUOTE  (!_DQUOTE  (ESCSTR | INTERP | .))* _DQUOTE  ", Str
      o             " _ _QUOTE   (!_QUOTE   (ESCSTR | .))* _QUOTE            ", Str
      i ESCSTR:     " _SLASH . ", (it) -> {n:'\n', t:'\t', r:'\r'}[it] or it
      i INTERP:     " '\#{' _RESETINDENT BLOCK ___ '}' "
    ]
    o NATIVE:       " _ _BTICK (!_BTICK .)* _BTICK ", NativeExpression
    o BOOLEAN:      " _TRUE | _FALSE ", (it) -> it is 'true'
    o NUMBER:       " _ /-?[0-9]+(\\.[0-9]+)?/ ", Number
    o SYMBOL:       " _ !_KEYWORD WORD "
  ]

  # WHITESPACES:
  i _:              " /[ ]*/ ",                          skipLog:no
  i __:             " /[ ]+/ ",                          skipLog:no
  i _TERM:          " _ ('\r\n'|'\n') ",                 skipLog:no
  i _COMMENT:       " _ !HEREDOC '#' (!_TERM .)* ",      skipLog:no
  i _BLANKLINE:     " _COMMENT? _TERM ",                 skipLog:no
  i ___:            " _BLANKLINE* _ ",                   skipLog:yes

  # BLOCKS:
  i BLOCK: [
    o               " _INDENT LINE+_NEWLINE ", Block
    o               " _THEN?  LINE+(_ ';') ", Block
    o               " _INDENTED_COMMENT+ ", -> Block []
    i _INDENTED_COMMENT: " _BLANKLINE ws:_ _COMMENT ", ({ws}) ->
                      return null if checkIndent.call(this, ws) is null
                      return undefined
  ]
  i BLOCKEXPR:      " _INDENT? EXPR "
  i _INDENT:        " _BLANKLINE+ &:_ ", checkIndent, skipCache:yes
  i _RESETINDENT:   " _BLANKLINE* &:_ ", resetIndent, skipCache:yes
  i _NEWLINE: [
    o               " _BLANKLINE+ &:_ ", checkNewline, skipCache:yes
    o               " _ ';'           "
  ], skipCache:yes
  i _SOFTLINE:      " _BLANKLINE+ &:_ ", checkSoftline, skipCache:yes
  i _COMMA:         " beforeBlanks:_BLANKLINE* beforeWS:_ ','
                      afterBlanks:_BLANKLINE*  afterWS:_ ", checkComma, skipCache:yes
  i _COMMA_NEWLINE: " _BLANKLINE+ &:_ ", checkCommaNewline, skipCache:yes

  # TOKENS:
  i WORD:           " _ /[a-zA-Z\\$_][a-zA-Z\\$_0-9]*/ ", Word
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

# Parse the given code
@parse = GRAMMAR.parse

# Interpret the given code
@run = (code, options = {}) ->
  mainModule = require.main

  # Set the filename.
  mainModule.filename = process.argv[1] =
    if options.filename then fs.realpathSync(options.filename) else '.'

  # Clear the module cache.
  mainModule.moduleCache and= {}

  # Assign paths for node_modules loading
  mainModule.paths = require('module')._nodeModulePaths path.dirname fs.realpathSync options.filename

  # Interpret
  jsi = require './interpreter/javascript'
  node = GRAMMAR.parse code
  return jsi.interpret(node, include:{require:require}) # TODO set require properly.
