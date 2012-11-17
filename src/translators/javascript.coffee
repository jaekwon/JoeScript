###

# AST Transformation

  This is responsible for translating a JoeScript AST into valid Javascript AST.
  Actually, the result needs to be a subset of Javascript so as to be interpretable
  from the joescript/src/interpreter. (this may change in the future).

  Here are the properties of RJavascript. (Restricted Javascript).

  1. No operational-assignments like +=, *=, ++, -- etc
     -> foo += bar ==>
          foo = (foo + bar)
     -> foo.bar += baz ==>
          foo.bar = (foo.bar + baz)
     -> foo.bar.baz += beh ==>
          temp = foo.bar
          temp.baz = (temp.baz + beh)
  2. ??? I don't think there are any more at the moment.
   
## The mechanism of translation

  1. Transform the AST into an RJavascript AST via the .toJSNode() method.
  2. Stringify to RJavascript code via toJavascript().

## .toJSNode

  This method recursively iterates through the AST tree and translates to RJavascript.
  It's not strictly depth first or breadth first, but whatever is convenient.
  The .toJSNode may mutate the node, or return a new node entirely. This means
  callers of .toJSNode must take care to use the result, and ignore the original node.

  >> jsNode = node.toJSNode({toVal, inject})

  The 'toVal' argument tells .toJSNode that the result must be a valid Javascript value.
  For instance, a Loop is not a valid value in Javascript, so a translation must take
  place to convert it into a Block with [].push of intermediate results.

  The 'inject' argument is a callback that injects a statement, invocation, etc into
  subtrees of the AST that are Javascript values. For example, the last expression of
  a function block implicitly returns.

    foo = ->
      a = 1
      if (true)
        b = 2
      else
        b = 3    becomes...

    foo = ->
      a = 1
      if (true)
        return (b = 2)
      else
        return (b = 3)

  Notice that a return statement was injected into multiple values.
  Sometimes you want to inject an invocation, as when translating Loops.

###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
uglify = require 'uglify-js'

{
  NODES:j
  HELPERS:{isVariable,isIndex}
} = require '../joescript'
{escape, compact, flatten} = require('../../lib/helpers')
{setOn} = require('../node')
require('../translators/scope') # dependency

js = (node, options) ->
  return '' if not node?
  try
    node.toJavascript(options)
  catch error
    console.log error
    console.log "serialize:", node?.serialize?()
    throw error
jsv = (node, options) ->
  options ?= {}
  options.isValue = yes
  js node, options
val = (node, required=yes) ->
  if required
    node.toJSNode toVal:yes
  else
    node?.toJSNode toVal:yes
identity = (x) -> x
mark = identity
# for debugging... (also see src/node.coffee/serialize())
# helps see what nodes were toJSNode()'d
if yes
  mark = (fn) -> ->
    result = fn.apply(@, arguments)
    result.marked = yes
    return result

j.Node::extend

  toJSNode: mark ({toVal,inject}={}) ->
    if inject and this not instanceof j.Statement
      return inject(this).toJSNode()
    else
      return @childrenToJSNode()

  # Convenience method, if you want to automatically .toJSNode children.
  # Most of the time you want to do that manually.
  childrenToJSNode: ->
    that = this
    @withChildren ({child, parent, desc, key, index}) ->
      if index?
        that[key][index] = child.toJSNode toVal:desc.isValue
      else
        that[key] = child.toJSNode toVal:desc.isValue
    @

  # 
  walkWithContext: ({pre, post}, ptr=undefined, {isValue}={}) ->
    isValue ?= no
    ptr ?= {child:@}
    stop = pre ptr, {isValue} if pre?
    return ptr.child if stop is '__stop__'
    ptr.child.withChildren (ptr) ->
      {child, parent, desc, key, index} = ptr
      if child instanceof j.Node
        if parent instanceof j.Block and index is parent.lines.length-1
          child_isValue = isValue
        if parent instanceof j.If and key in ['block', 'elseBlock']
          child_isValue = isValue
        else
          child_isValue = desc.isValue or no
        child.walkWithContext({pre, post}, {child,parent,desc,key,index}, {isValue:child_isValue})
    post ptr, {isValue} if post?
    return ptr.child

  # Replace Word with another Word
  # returns: yes of any replacement occurred.
  replaceWord: (word, replace, ptr=undefined) ->
    if this instanceof j.Word
      if this is word or @key? and @key is word.key
        setOn ptr, replace if ptr?
        return yes
      return no
    replaced = no
    @withChildren (ptr) ->
      if ptr.child instanceof j.Node and ptr.child not instanceof j.Func
        return replaced or= ptr.child.replaceWord word, replace, ptr
      return no
    return replaced

  # Nested blocks
  compressBlocks: ->
    return @walkWithContext post:(ptr, {isValue}) ->
      {child} = ptr
      if child instanceof j.Block
        compressed = []
        for line in child.lines
          if line instanceof j.Block
            assert.ok not line.ownScope, "Block within block shouldn't have own scope." # TODO reconsider
            compressed[compressed.length...] = line.lines
          else
            compressed.push line
        child.lines = compressed

  # A block in javascript that includes a non-js-expression (e.g. switch, try, loops...)
  # must be lifted into a (function(){})() to be usable as a value.
  # This step isn't necessary for the interpreter,
  # since those non-js-expressions *are* expressions in JoeScript.
  liftBlocks: ->
    # Assert that none of the blocks which are values include statements.
    return @walkWithContext pre:(ptr, {isValue}) ->
      {child} = ptr
      if isValue and child instanceof j.Block
        block = child
        # Assert that value blocks do not contain return statements.
        # TODO move this assertion to a separate step.
        block.walk pre:({child}) ->
          return '__stop__' if child instanceof j.Func
          assert.ok not child.isReturn, "Value (block) cannot contain a return statement:\n#{block}"
        # replace child with an invocation if block includes a non-js-expression
        if block.lines.any((line) -> line.isJSValue is no)
          # replace all 'argument' words into Undetermined shared with the outer scope.
          replaced = block.replaceWord j.Word('arguments'), _arguments=j.Undetermined('_arguments')
          # lift block
          lifted = j.Invocation
            func: j.Func
              type:  '->'
              block: block.toJSNode({inject:(value) ->
                  j.Statement(type:'return', expr:value)
                })
            params: []
          # if arguments was replaced we need to assign _arguments = arguments.
          lifted = j.Block([j.Assign(target:_arguments,value:j.Word('arguments')), lifted]) if replaced
          setOn ptr, lifted
      return

  toJavascript: ->
    throw new Error "#{@constructor.name}.toJavascript not defined. Why don't you define it?"

  # Calls fn with a variable that holds a ref to this node value,
  # fn should return {block,else} which gets set on the resulting If node.
  withSoak: (fn) ->
    cond = j.Operation(
      left: j.Operation(
        left: j.Assign(target:ref=j.Undetermined('_ref'),value:this),
        op:   '!='
        right:j.Singleton.null
      ),
      op: '&&'
      right: j.Operation(
        left: ref
        op:   '!='
        right:j.Singleton.undefined
      )
    )
    if fn?
      {block,else:else_}= fn(ref)
      return j.If(
        cond:  cond,
        block: block,
        else:  else_
      )
    else
      return cond

  # Translates a potentially soakful value (or assignment) into an If block.
  unsoak: () ->
    # leftmost soak & container
    soakContainer = undefined
    soak = undefined
    cursor = this
    loop
      if cursor.soakable instanceof j.Soak
        soakContainer = cursor
        soak = cursor.soakable
      cursor = cursor.soakable
      break if not cursor?
    # now soakable is the leftmost soak.
    if soak?
      return soak.obj.withSoak (ref) =>
        assert.ok soakContainer.soakable is soak, "Unexpected soak container #{soakContainer}"
        # replace soak with ref for soakContainer
        soakContainer.soakable = ref
        # soak node again from the top.
        # this is an O(n^2) operation, which could be optimized.
        return block:@unsoak(), else:j.Singleton.undefined
    else
      return @

j.Word::extend
  toJavascript: -> @key
  withSoak: (fn) ->
    cond = j.Operation(
      left:j.Operation(
        left: j.Index(obj:@, type:'#', key:j.Word('type'))
        op:   '!='
        right:"undefined"
      ),
      op: '&&'
      right:j.Operation(
        left: @
        op:   '!='
        right:j.Singleton.null
      )
    )
    if fn?
      {block,else:else_}= fn(@)
      return j.If(
        cond:  cond,
        block: block,
        else:  else_
      )
    else
      return cond

j.Undetermined::extend
  toJavascript: ->
    throw new Error "Shouldn't happen..." if not @key?
    @key

j.Block::extend
  toJSNode: mark ({toVal,inject}={}) ->
    for line, i in @lines
      if i < @lines.length-1
        @lines[i] = line.toJSNode()
      else
        @lines[i] = line.toJSNode({toVal,inject})
    @
  toJavascript: ({isValue, withCommas}={}) ->
    withCommas ?= isValue
    if @ownScope? and (toDeclare=@ownScope.nonparameterVariables)?.length > 0
      lines = [j.NativeExpression("var #{toDeclare.map((x)->x.toKeyString()).join(', ')}"), @lines...]
    else
      lines = @lines
    delim = if withCommas then ', ' else ';\n'
    jsStr = (for line, i in lines
      if i < lines.length-1 then js(line) else js(line, {isValue})).join delim
    if isValue then "(#{jsStr})" else jsStr

j.If::extend
  toJSNode: mark ({toVal,inject}={}) ->
    @cond  = val(@cond)
    @block = @block.toJSNode {toVal,inject}
    @else  = @else?.toJSNode {toVal,inject}
    @
  toJavascript: ({isValue}={}) ->
    if isValue
      if @else?
        "(#{jsv @cond} ? #{jsv @block, withCommas:yes} : #{jsv @else, withCommas:yes})"
      else
        "(#{jsv @cond} ? #{jsv @block, withCommas:yes} : undefined)"
    else
      if @else?
        "if(#{jsv @cond}){#{js @block}}else{#{js @else}}"
      else
        "if(#{jsv @cond}){#{js @block}}"

j.Try::extend
  toJSNode: mark ({toVal,inject}={}) ->
    if toVal or inject
      target = j.Undetermined('_temp')
      @block = @block.toJSNode( inject:(value) -> j.Assign({target, value}))
      @catch = @catch?.toJSNode(inject:(value) -> j.Assign({target, value}))
      @catchVar = @catchVar ? j.Undetermined('_err')
      return j.Block([this, target.toJSNode({toVal,inject})])
    else
      @catchVar = @catchVar ? j.Undetermined('_err')
      return @childrenToJSNode()
  toJavascript: -> "try {#{js @block}}#{
    (@catchVar? or @catch?) and " catch(#{js(@catchVar) or ''}) {#{js @catch}}" or ''}#{
    @finally and "finally {#{js @finally}}" or ''}"

j.Loop::extend
  toJSNode: mark ({toVal,inject}={}) ->
    if toVal or inject
      lines = []
      # <Variable> = []
      lines.push j.Assign target:(target=j.Undetermined('_accum')), value:j.Arr()
      # @label:
      # while(@cond) {
      #   <Variable>.push(@block)
      # }
      @block = @block.toJSNode({inject:(value)->
        j.Invocation
          func:   j.Index(obj:target, key:j.Word('push'))
          params: [j.Item {value}]
      })
      lines.push this
      # <Variable>
      lines.push target.toJSNode({toVal,inject})
      return j.Block(lines)
    else
      return @childrenToJSNode()
  toJavascript: -> "while(#{jsv @cond}) {#{js @block}}"

j.JSForC::extend
  toJavascript: -> "for(#{js @setup, withCommas:yes}; #{jsv @cond}; #{js @counter, withCommas:yes}){#{js @block}}"

j.JSForK::extend
  toJavascript: -> "for(#{js @key} in #{jsv @obj}){#{js @block}}"

j.For::extend
  toJSNode: mark ({toVal,inject}={}) ->
    if toVal or inject
      # call Loop.toJSNode to accumuate.
      accum = @super.toJSNode.call(@, {toVal,inject})
      # finally call this function again.
      return accum.toJSNode()

    switch @type
      when 'in' # Array iteration
        if @obj instanceof j.Range
          setup = j.Block compact [
            # for (@keys[1] = 0,
            j.Assign(target:_i=@keys[1], value:0) if @keys[1]?
            #   @keys[0] = @obj.from,
            j.Assign(target:_val=@keys[0], value:@obj.from ? 0)
            #   _to = @obj.to ? undefined
            j.Assign(target:_to=j.Undetermined('_to'), value:(@obj.to ? j.Singleton.undefined))
            #   _by = @obj.by ? 1;
            j.Assign(target:_by=j.Undetermined('_by'), value:(@obj.by ? 1))
          ]
          cond = j.Operation left:@keys[0], op:(if @obj.exclusive then '<' else '<='), right:_to
          counter = j.Block compact [
            j.Assign(target:_i, type:'+=', value:1) if @keys[1]?
            j.Assign(target:_val, type:'+=', value:_by)
          ]
          block =
            if @cond?
              j.If(cond:@cond, block:@block)
            else
              @block
        else
          setup = j.Block compact [
            # _obj = <?>
            j.Assign(target:_obj=j.Undetermined('_obj'), value:@obj),
            if @keys.length > 1
              # for (@keys[1] = _i = 0; ...
              j.Assign(target:@keys[1], value:j.Assign(target:_i=j.Undetermined('_i'), value:0))
            else
              # for (_i = 0; ...
              j.Assign(target:_i=j.Undetermined('_i'), value:0)
            ,
            # _len = <?>
            j.Assign(target:_len=j.Undetermined('_len'), value:j.Index(obj:_obj, key:j.Word('length'), type:'.')),
          ]
          # _i < _len; ...
          cond = j.Operation left:_i, op:'<', right:_len
          counter =
            if @keys.length > 1
              # @keys[1] = _i++)
              j.Assign(target:@keys[1], value:j.Operation(left:_i, op:'++'))
            else
              # _i++)
              j.Operation(left:_i, op:'++')
          block = j.Block [
            # @keys[0] = _obj[_i]
            j.Assign(target:@keys[0], value:j.Index(obj:_obj, key:_i, type:'[')),
            if @cond?
              # if (@cond) { @block }
              j.If(cond:@cond, block:@block)
            else
              @block
          ]
        node = j.JSForC label:@label, block:block, setup:setup, cond:cond, counter:counter
        return node.childrenToJSNode()

      when 'of' # Object iteration
        return j.Block([
          j.Assign(target:_obj=j.Undetermined('_obj'), value:@obj),
          j.JSForK(label:@label, key:@keys[0], obj:_obj, block:j.Block(compact [
              if @keys[1]
                j.Assign(target:@keys[1], value:j.Index(obj:_obj, type:'[', key:@keys[0]))
              else
                undefined
              if @cond?
                # if (@cond) { @block }
                j.If(cond:@cond, block:@block)
              else
                @block
            ])
          )
        ]).childrenToJSNode()
        
      else throw new Error "Unexpected For type #{@type}"
    # end switch
    assert.ok no, 'should not happen'

j.Switch::extend
  toJSNode: mark ({toVal,inject}={}) ->
    if toVal or inject
      # @obj @cases @default
      lines = []
      # <Variable> = undefined
      lines.push j.Assign target:(target=j.Undetermined('_temp')), value:j.Singleton.undefined
      # switch(@obj) { case(case.matches) { <Variable> = case.block } for case in @cases }
      @obj = val(@obj)
      @cases = for _case in @cases then _case.toJSNode(inject:(value)->j.Assign({target,value}))
      @default = @default?.toJSNode(inject:(value) -> j.Assign({target,value}))
      lines.push this
      # <Variable>
      lines.push target.toJSNode({toVal,inject})
      return j.Block(lines)
    else
      return @childrenToJSNode()
  toJavascript: ->
    """
      switch (#{jsv(@obj)}) {
        #{(js(_case) for _case in @cases||[]).join('')}
        default:
          #{if @default? then js(@default) else 'undefined'}
      }
    """

j.Case::extend
  toJSNode: mark ({inject}={}) ->
    @matches = for match in @matches then val(match)
    @block = @block.toJSNode({inject})
    return @
  toJavascript: ->
    """#{("case #{js(match)}:\n" for match in @matches).join('')
      }#{js(@block)}; break;\n"""

TO_JS_OPS = {'is':'===', '==':'===', 'isnt':'!==', '!=':'!==', 'or':'||', 'and':'&&', 'not':'!'}
j.Operation::extend
  toJSNode: mark ({toVal,inject}={}) ->
    switch @op
      when '?'
        return (inject ? identity) @left.withSoak((ref) =>
          block: ref,
          else: @right
        ).toJSNode({toVal,inject})
      when '++','--'
        if @left?
          if toVal
            return j.Operation(left:val(j.Assign(target:@left, op:'+', value:1)), op:'-', right:1) if @op is '++'
            return j.Operation(left:val(j.Assign(target:@left, op:'-', value:1)), op:'+', right:1)
          else
            return val(j.Assign(target:@left, op:'+', value:1)) if @op is '++'
            return val(j.Assign(target:@left, op:'-', value:1))
        else
          return val(j.Assign(target:@right, op:'+', value:1)) if @op is '++'
          return val(j.Assign(target:@right, op:'-', value:1))
      else return (inject ? identity) @childrenToJSNode()
  toJavascript: -> "(#{ if @left?  then jsv(@left)+' '  else ''
                    }#{ TO_JS_OPS[@op] ? @op
                    }#{ if @right? then ' '+jsv(@right) else '' })"

j.Statement::extend
  toJavascript: -> "#{@type} #{if @expr? then jsv(@expr) else ''}"

j.Assign::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return unsoaked.toJSNode({toVal,inject}) unless (unsoaked=@unsoak()) is this
    assert.ok not (@target instanceof j.AssignObj and @op?), "Destructuring assignment with op?"
    if @target instanceof j.AssignObj
      lines = []
      if isVariable @value
        valueVar = @value
      else
        valueVar = j.Undetermined('_temp')
        lines.push j.Assign target:valueVar, value:val(@value)
      @target.destructLines lines, valueVar
      lines.push valueVar.toJSNode({toVal,inject}) if toVal or inject
      return j.Block(lines)
    else if @target instanceof j.Index and @target.type is '?'
      # @?bar = RHS         ==>   @bar = bar = RHS
      # bar.baz?bak = RHS   ==>   bar.baz.bak = bak = RHS
      # bar.baz?bak += RHS  ==>   bar.baz.bak = bak += RHS
      # bar?baz?bak = RHS   ==>   error
      @value = j.Assign target:@target.key, value:@value, op:@op
      @op = undefined
      @target.type = '.'
      return @toJSNode({toVal, inject})
    else if @op?
      if isVariable(@target) or isIndex(@target) and isVariable(@target.obj)
        # Simple like `x += 1` or `foo.bar += 1`.
        # But, anything more complex like `foo.bar.baz += 1` or
        # `(foo = {bar:1}; foo).bar += 1` requires a translation to avoid side effects.
        @value = val(j.Operation(left:@target, op:@op, right:@value))
        @op = undefined
        return (inject ? identity)(@) # no toJSNode() necessary.
      else
        # something.complex.baz += @value
        #   .. becomes ..
        # baseVar = something.complex
        # baseVar.baz = baseVar + @value
        lines = []
        baseObj = @target.obj
        baseVar = j.Undetermined('_ref')
        lines.push j.Assign(target:baseVar, value:baseObj)
        baseIndex = j.Index(obj:baseVar, key:@target.key, type:@target.type)
        opValue = j.Operation(left:baseIndex, op:@op, right:@value)
        lines.push j.Assign(target:baseIndex, value:opValue)
        return j.Block(lines).toJSNode({toVal,inject})
    else
      return @childrenToJSNode()
  toJavascript: ({isValue}={}) ->
    if isValue
      "(#{js @target} #{@op or ''}= #{jsv @value})"
    else
      "#{js @target} #{@op or ''}= #{jsv @value}"

j.AssignObj::extend
  # lines:    The array into which assignment nodes will be pushed
  # source:   The source for destructuring assignment
  # CONTRACT: Input source and output lines are javascript.
  destructLines: (lines, source) ->
    for item in @items
      target   = item.target ? item.key
      key      = item.key
      default_ = item.default
      if target instanceof j.Word or target instanceof j.Index
        lines.push j.Assign target:target, value:j.Index(obj:source, key:key)
        lines.push j.Assign target:target, value:default_, type:'?=' if default_?
      else if target instanceof j.AssignObj
        temp = j.Undetermined('_ref')
        lines.push j.Assign target:temp, value:j.Index(obj:source, key:key)
        lines.push j.Assign target:temp, value:default_, type:'?=' if default_?
        target.destructLines lines, temp
      else
        throw new Error "Unexpected AssignObj target: #{target} (#{target?.constructor.name})"
    return

j.AssignList::extend
  # lines:    The array into which assignment nodes will be pushed
  # source:   The source for destructuring assignment
  # CONTRACT: Input source and output lines are javascript.
  destructLines: (lines, source) ->
    return unless @items?
    splatIndex = numHeads = @items.findIndex (item) -> item.splat
    if splatIndex >= 0
      numTails = @items.length - 1 - splatIndex
      for i in [0...splatIndex]
        item = @items[i]
        [target, key, default_] = [item.target, i, item.default]
        j.AssignList::destructItem lines, source, target, key, default_
      splatItem = @items[splatIndex]
      lines.push j.Assign
        target: splatItem.target
        value: j.If(
          cond: j.Operation
            left: @items.length
            op: '<='
            right: j.Index(obj:source, key:j.Word('length'))
          block: j.Invocation
            func: j.Word('__slice') # TODO reserved word?
            binding: source
            params: compact [
              j.Item(value:numHeads),
              if numTails
                j.Item(value:j.Assign
                  target: _i=j.Undetermined('_i')
                  value: j.Operation
                    left: j.Index(obj:source, key:j.Word('length'))
                    op: '-'
                    right: numTails
                )
            ]
          else:
            if numTails
              j.Block [
                j.Assign(target:_i, value:numHeads),
                j.Arr()
              ]
            else j.Arr()
        )
      for i in [splatIndex+1...@items.length]
        item = @items[i]
        [target, key, default_] = [item.target, j.Operation(left:_i, op:'++'), item.default]
        j.AssignList::destructItem lines, source, target, key, default_
    else
      for item, i in @items
        [target, key, default_] = [item.target, i, item.default]
        j.AssignList::destructItem lines, source, target, key, default_
    return
  destructItem: (lines, source, target, key, default_) ->
    if target instanceof j.Word or target instanceof j.Index
      lines.push j.Assign target:target, value:j.Index(obj:source, key:key)
      lines.push j.Assign target:target, value:default_, type:'?=' if default_?
    else if target instanceof j.AssignObj
      temp = j.Undetermined('_ref')
      lines.push j.Assign target:temp, value:j.Index(obj:source, key:key)
      lines.push j.Assign target:temp, value:default_, type:'?=' if default_?
      target.destructLines lines, temp
    else
      throw new Error "Unexpected AssignObj target: #{target} (#{target?.constructor.name})"
  # Used by `do (param1, param2, ...) -> ...` constructs.
  # Returns an array of Items, suitable invocation parameters.
  extractWords: ->
    words = []
    for item, i in @items
      assert.ok item.target instanceof j.Word, "extractKeys() wants words."
      words.push item.target
    return (j.Item(key:undefined, value:word) for word in words)

j.Str::extend
  getParts: ->
    return [this] if typeof @parts is 'string'
    nodes = []
    for part in @parts
      if part instanceof j.Node
        nodes.push '' if nodes.length is 0 # must start with a string.
        nodes.push part
      else
        nodes.push ''+part
    return nodes
    
  toJSNode: mark ({toVal,inject}={}) ->
    return inject(this).toJSNode({toVal}) if inject?
    node = undefined
    # construct a '+' operation with the @parts.
    for part in @getParts() when (node is undefined) or part
      if node is undefined
        node = part
        continue
      else
        node = j.Operation left:node, op:'+', right:part
    return node?.toJSNode({toVal}) or ''
      
  # toJavascript: -> should have been converted to strings, nodes, and + operations.

j.Regex::extend
  toJavascript: -> "/#{@pattern}/#{@flags}"

j.Func::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return inject(this).toJSNode({toVal}) if inject?
    ## TODO bind to this for '=>' @type binding
    ## destructuring parameters
    if @params?
      # If none of the top-level parameters contain a splat,
      # try to preserve the argument structure in the resulting javascript.
      if not @params.items.any((item) -> item.splat)
        lines = []
        for param, i in @params.items
          {target, default:_default} = param
          param.default = undefined # javascript doesn't support default param values.
          if not isVariable target
            if target instanceof j.AssignObj
              arg = j.Undetermined('_arg')
              @params.items[i] = j.AssignItem target:arg
              lines.push j.Assign target:arg, op:'?', value:_default if _default?
              target.destructLines lines, arg
            else if target instanceof j.Index
              assert.ok target.isThisProp, "Unexpected parameter target #{target}"
              arg = j.Word(''+target.key)
              @params.items[i] = j.AssignItem target:arg
              lines.push j.Assign target:arg, op:'?', value:_default if _default?
              lines.push j.Assign target:target, value:arg
            else
              throw new Error "Unexpected parameter target #{target}"
          else
            lines.push j.Assign target:target, op:'?', value:_default if _default?
        @block.lines[...0] = lines
      # If top-level parameters contain a splat, destructure from `arguments`.
      else
        lines = []
        @params.destructLines lines, j.Word('arguments')
        @params = undefined
        @block.lines[...0] = lines
    ## make last line return
    @block = @block?.toJSNode({inject:(value)->
      j.Statement(type:'return', expr:value)
    })
    return this
  toJavascript: ->
    "(function(#{@params?.items.map((p)->js(p.target)).join(',') ? ''}) {#{if @block? then js @block else ''}})"

# NOTE: not to be produced in toJSNode, which is interpreted by src/interpreter.
j.NativeExpression::extend
  toJavascript: -> @exprStr

j.Singleton::extend
  toJavascript: -> @name

j.Invocation::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return unsoaked.toJSNode({toVal,inject}) unless (unsoaked=@unsoak()) is this
    return inject(this).toJSNode({toVal}) if inject?
    switch @func
      when 'do'
        assert.ok @params.length is 1 and @params[0].value instanceof j.Func, "Joescript `do` wants one function argument"
        assert.ok @binding is undefined, "Joescript `do` cannot have a binding"
        @func = val(@params[0].value)
        @params = @func.params?.extractWords()
        @binding = j.Word('this')
        return @
      when 'in'
        assert.ok @params.length is 2, "Joescript `in` wants two function arguments"
        assert.ok @binding is undefined, "Joescript `in` cannot have a binding"
        @func = j.Word('__indexOf')
        @binding = @params.pop().value
        return j.Operation(left:val(@), op:'>=', right:0)
      when 'instanceof'
        assert.ok @params.length is 2, "Joescript `instanceof` wants two function arguments"
        assert.ok @binding is undefined, "Joescript `instanceof` cannot have a binding"
        return @childrenToJSNode()
      when 'new'
        assert.ok @params.length is 1, "Joescript `new` wants one construction argument (which may be an invocation with more arguments)"
        assert.ok @binding is undefined, "Joescript `new` cannot have a binding"
        return @childrenToJSNode()
      else
        hasSplat = @params?.any (item) -> item.splat
        if hasSplat
          assert.ok not @apply, "Joescript apply-invocation should not have splats."
          @apply = yes
          if isIndex(@func)
            # foo.bar(splat...) -> foo.bar.apply(foo, splat)
            if isVariable(@func.obj)
              @binding ?= @func.obj
            # foo.bar.baz(splat...) -> (_ref = foo.bar).baz(_ref, splat)
            else
              @func.obj = j.Assign(target:ref=j.Undetermined('_ref'),value:val(@func.obj))
              @binding ?= ref
            @params = [j.Item(value:val(j.Arr(@params)))]
          # (func)(splat...) -> (func).apply(null, splat)
          else
            @binding ?= j.Singleton.null
            @params = [j.Item(value:val(j.Arr(@params)))]
        else # not hasSplat
          @func = val(@func)
          @binding = val(@binding, no)
          @params?.map (p) ->
            p.value = val(p.value)
        return @
  toJavascript: ->
    if @func is 'instanceof'
      "(#{jsv @params[0].value}) instanceof (#{jsv @params[1].value})"
    else if @func is 'new'
      "(new #{jsv @params[0].value})"
    else if @binding?
      method = if @apply then 'apply' else 'call'
      if @params?
        "#{jsv @func}.#{method}(#{jsv @binding}, #{@params.map (p)->jsv(p.value)})"
      else
        "#{jsv @func}.#{method}(#{jsv @binding})"
    else
      if @params?
        "#{jsv @func}(#{@params.map (p)->jsv(p.value)})"
      else
        "#{jsv @func}()"

j.Index::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return unsoaked.toJSNode({toVal,inject}) unless (unsoaked=@unsoak()) is this
    return @super.toJSNode.call(@, {toVal,inject})
  toJavascript: ->
    switch @type
      when '#'
        if @key.toKeyString() is 'type'
          return "typeof #{js @obj}"
        else
          throw new Error "Unknown meta type #{@key}."
      when '!'
        return "delete #{js @obj}.#{js @key}"
      when '!['
        "delete #{jsv @obj}[#{js @key}]"
      when '['
        "#{jsv @obj}[#{js @key}]"
      when '.'
        "#{jsv @obj}.#{js @key}"
      when '?'
        throw new Error "'?' type indices are only valid on the LHS of an assignment, and only on the rightmost key"
      else
        throw new Error "Unknown index type (#{@type})."

j.Obj::extend
  toJSNode: mark ({toVal,inject}={}) ->
    if @items?
      for item in @items
        item.key = val(item.key, no)
        if item.value?
          item.value = val(item.value)
        else
          item.value = item.key
    return (inject ? identity)(@) # nore toJSNode() necessary.
  toJavascript: ->
    return '{}' unless @items?
    "{#{("#{js key}: #{jsv value}" for {key, value} in @items).join ', '}}"

j.Arr::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return inject(this).toJSNode() if inject?
    return @ if not @items?
    hasSplat = @items.any (item) -> item.splat
    return @childrenToJSNode() unless hasSplat
    partitions = []
    cursor = []
    for item in @items
      if item.splat
        if cursor.length > 0
          partitions.push j.Arr(cursor.map (x)->j.Item(value:x))
          cursor = []
        assert.ok item.key is undefined, "Key not supported for Arr items"
        partitions.push j.Invocation func:j.Word('__slice'), binding:item.value
      else
        cursor.push item.value
    if cursor.length > 0
      partitions.push j.Arr(cursor.map (x)->j.Item(value:x))
      cursor = undefined
    return val(partitions[0]) if partitions.length is 1
    return val(j.Invocation(
      func:   j.Index(obj:partitions[0], key:j.Word('concat'))
      params: partitions[1...].map (x) -> j.Item(value:x)
    ))
    
  toJavascript: ->
    return '[]' unless @items?
    # TODO need to handle splats...
    "[#{(jsv(value) for {key, value} in @items).join ', '}]"

j.Slice::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return unsoaked.toJSNode({toVal,inject}) unless (unsoaked=@unsoak()) is this
    return j.Invocation(
      func: j.Index(obj:@obj, key:'slice', type:'.')
      #func: j.Word('__slice')
      #binding: @obj
      params: [
        j.Item(value:@range.from ? j.Singleton.undefined),
        (if @range.to?
          if @range.exclusive
            j.Item(value:@range.to)
          else
            j.Item(value:j.Operation(left:1, op:'+', right:@range.to))
        else
          j.Item(value:j.Singleton.undefined)),
        j.Item(value:@range.by   ? j.Singleton.undefined) # TODO not supported in js.
      ]
    ).toJSNode({toVal,inject})

j.Soak::extend
  toJSNode: mark ({toVal,inject}={}) ->
    return unsoaked.toJSNode({toVal,inject}) unless (unsoaked=@unsoak()) is this
    return @obj.withSoak().toJSNode({toVal,inject})
  toJavascript: ->
    throw new Error "Should not happen, soak is not Javascript."

j.Heredoc::extend
  toJavascript: ->
    text = @text
    length = text.length
    loop
      text = text.replace(/\*\//g, '* /')
      break if text.length is length
      length = text.length
    return "/*#{text}*/"

for cls in [Number, String, Boolean] then clazz.extend cls,
  toJSNode: mark ({inject}={}) -> inject?(@valueOf()).toJSNode() ? @valueOf()
  toVal: -> @valueOf()
  toJavascript: -> ''+@ # see clazz.extend String below.
  withSoak: (fn) ->
    cond = j.Operation(
      left:j.Operation(
        left: j.Index(obj:@valueOf(), type:'?', key:j.Word('type'))
        op:   '!='
        right:"undefined"
      ),
      op: '&&'
      right:j.Operation(
        left: @valueOf()
        op:   '!='
        right:j.Singleton.null
      )
    )
    if fn?
      {block,else:else_}= fn(@valueOf())
      return j.If(
        cond:  cond,
        block: block,
        else:  else_
      )
    else
      return cond

clazz.extend String,
  toJavascript: -> '"' + escape(@) + '"'

@JS_HELPERS = JS_HELPERS =
  __bind: """
    function(fn, me){
      return function(){ return fn.apply(me, arguments); };
    }
  """.replace(/\s+/g, ' ')
  __indexOf: """
    [].indexOf || function(item) {
      for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item) return i;
      }
      return -1;
    }
  """.replace(/\s+/g, ' ')
  __hasProp: '{}.hasOwnProperty'
  __slice: '[].slice'

@allHelpers = allHelpers = -> ("#{k}=#{v}" for k, v of JS_HELPERS).join ';\n'

@addHelpers = addHelpers = (js) ->
  helpers = ''
  for k, v of JS_HELPERS
    if js.indexOf(k) >= 0
      helpers += "#{k}=#{v};\n"
  if helpers
    return "#{helpers}#{js}"
  else
    return js

# opts:
#   includeHelpers: (default yes)
#   wrapInClosure:  (default yes)
@translate = translate = (node, opts = {}) ->
  node.validate()
  # Wrap code in a closure by default.
  unless opts.wrapInClosure is no
    assert.ok node instanceof j.Block, "Expected to translate a block but got #{node.constructor?.name}. Set 'wrapInClosure' to no?"
    node = j.DoBlock node.lines
  node = node.
    toJSNode().
    compressBlocks().
    liftBlocks().
    installScope().
    determine().
    validate()
  js_raw = node.toJavascript()
  js_raw = addHelpers js_raw unless opts.includeHelpers is no
  try
    js_ast = uglify.parser.parse js_raw
  catch error
    # prepend js_raw with line numbers with colors.
    js_raw_lineno = ("#{blue i} #{red line}" for line, i in js_raw.split('\n')).join('\n')
    console.log "Error in uglify.parser.parse():\n#{error.stack ? error}\n\n#{js_raw_lineno}\n\n#{node.serialize()}"
    throw error
  js_pretty = uglify.uglify.gen_code(js_ast, beautify:yes, indent_level:2)
  return js_pretty
