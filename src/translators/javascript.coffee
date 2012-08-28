###

# AST Transformation

  This is responsible for translating a JoeScript AST into valid Javascript AST.
  Actually, the result needs to be a subset of Javascript so as to be interpretable
  from the sembly/src/interpreter. (this may change in the future).

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

  The 'toValue' argument tells .toJSNode that the result must be a valid Javascript value.
  For instance, a Loop is not a valid value in Javascript, so a translation must take
  place to convert it into a Block with [].push of intermediate results.

## .inject

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
  NODES:joe
  HELPERS:{isVariable,isIndex}
} = require 'sembly/src/joescript'
{escape, compact, flatten} = require('sembly/lib/helpers')
{setOn} = require('sembly/src/node')

js = (obj, options) ->
  return '' if not obj?
  try
    obj.toJavascript(options)
  catch error
    console.log error
    console.log "serialize:", obj?.serialize?()
    throw error
identity = (x) -> x
mark = identity
# for debugging... (also see src/node.coffee/serialize())
# helps see what nodes were toJSNode()'d
if yes
  mark = (fn) -> ->
    result = fn.apply(@, arguments)
    result.marked = yes
    return result

@install = install = ->
  return if joe.Node::toJSNode? # already defined.
  require('sembly/src/translators/scope').install() # dependency

  joe.Node::extend

    toJSNode: mark ($, {toValue,inject}={}) ->
      if inject and this not instanceof joe.Statement
        return inject(this).toJSNode($)
      else
        return @childrenToJSNode($)

    # Convenience method, if you want to automatically .toJSNode children.
    # Most of the time you want to do that manually.
    childrenToJSNode: ($) ->
      that = this
      @withChildren ({child, parent, desc, key, index}) ->
        if index?
          that[key][index] = child.toJSNode $, toValue:desc.isValue
        else
          that[key] = child.toJSNode $, toValue:desc.isValue
      @

    # 
    walkWithContext: ($, {pre, post}, ptr=undefined, {isValue}={}) ->
      isValue ?= no
      ptr ?= {child:@}
      stop = pre ptr, {isValue} if pre?
      return ptr.child if stop is '__stop__'
      ptr.child.withChildren (ptr) ->
        {child, parent, desc, key, index} = ptr
        if child instanceof joe.Node
          if parent instanceof joe.Block and index is parent.lines.length-1
            child_isValue = isValue
          if parent instanceof joe.If and key in ['block', 'elseBlock']
            child_isValue = isValue
          else
            child_isValue = desc.isValue or no
          child.walkWithContext($, {pre, post}, {child,parent,desc,key,index}, {isValue:child_isValue})
      post ptr, {isValue} if post?
      return ptr.child

    # A block in javascript that includes a non-js-expression (e.g. switch, try, loops...)
    # must be lifted into a (function(){})() to be usable as a value.
    # This step isn't necessary for the interpreter,
    # since those non-js-expressions *are* expressions in JoeScript.
    liftBlocks: ($) ->
      # Assert that none of the blocks which are values include statements.
      return @walkWithContext $, pre:(ptr, {isValue}) ->
        {child} = ptr
        if isValue and child instanceof joe.Block
          block = child
          # Assert that value blocks do not contain return statements.
          # TODO move this assertion to a separate step.
          block.walk pre:({child}) ->
            return '__stop__' if child instanceof joe.Func
            assert.ok not child.isReturn, "Value (block) cannot contain a return statement:\n#{block}"
          # replace child with an invocation if block includes a non-js-expression
          if block.lines.any((line) -> line.isJSValue is no)
            lifted = joe.Invocation
              func: joe.Func
                type:  '->'
                block: block.toJSNode($, {inject:(value) ->
                    joe.Statement(type:'return', expr:value)
                  })
              params: []
            setOn ptr, lifted
        return

    toJavascript: ->
      throw new Error "#{@constructor.name}.toJavascript not defined. Why don't you define it?"

    # Calls fn with a variable that holds a ref to this node value,
    # fn should return {block,else} which gets set on the resulting If node.
    withSoak: (fn) ->
      cond = joe.Operation(
        left: joe.Operation(
          left: joe.Assign(target:ref=joe.Undetermined('ref'),value:this),
          op:   '!='
          right:joe.Singleton.null
        ),
        op: '&&'
        right: joe.Operation(
          left: ref
          op:   '!='
          right:joe.Singleton.undefined
        )
      )
      if fn?
        {block,else:else_}= fn(ref)
        return joe.If(
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
        if cursor.soakable instanceof joe.Soak
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
          return block:@unsoak(), else:joe.Singleton.undefined
      else
        return @

  joe.Word::extend
    toJavascript: ->
      ''+this
    withSoak: (fn) ->
      cond = joe.Operation(
        left:joe.Operation(
          left: joe.Index(obj:@, type:'?', key:joe.Word('type'))
          op:   '!='
          right:"undefined"
        ),
        op: '&&'
        right:joe.Operation(
          left: @
          op:   '!='
          right:joe.Singleton.null
        )
      )
      if fn?
        {block,else:else_}= fn(@)
        return joe.If(
          cond:  cond,
          block: block,
          else:  else_
        )
      else
        return cond

  joe.Undetermined::extend
    toJavascript: -> throw new Error "Shouldn't happen..."

  joe.Block::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      for line, i in @lines
        if i < @lines.length-1
          @lines[i] = line.toJSNode($)
        else
          @lines[i] = line.toJSNode($, {toValue,inject})
      @
    toJavascript: ({isValue, withCommas}={}) ->
      if @ownScope? and (toDeclare=@ownScope.nonparameterVariables)?.length > 0
        lines = [joe.NativeExpression("var #{toDeclare.map((x)->x.toKeyString()).join(', ')}"), @lines...]
      else
        lines = @lines
      delim = if withCommas then ', ' else ';\n'
      (for line, i in lines
        if i < lines.length-1 then js(line) else js(line, {isValue})).join delim

  joe.If::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      @cond  = @cond.toJSNode  $, {toValue:yes}
      @block = @block.toJSNode $, {toValue,inject}
      @else  = @else?.toJSNode $, {toValue,inject}
      @
    toJavascript: ({isValue}={}) ->
      if isValue
        if @else?
          "(#{js @cond, isValue:yes} ? #{js @block, isValue:yes, withCommas:yes} : #{js @else, isValue:yes, withCommas:yes})"
        else
          "(#{js @cond, isValue:yes} ? #{js @block, isValue:yes, withCommas:yes} : undefined)"
      else
        if @else?
          "if(#{js @cond, isValue:yes}){#{js @block}}else{#{js @else}}"
        else
          "if(#{js @cond, isValue:yes}){#{js @block}}"

  joe.Try::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      if toValue or inject
        target = joe.Undetermined('temp')
        @block = @block.toJSNode( $, inject:(value) -> joe.Assign({target, value}))
        @catch = @catch?.toJSNode($, inject:(value) -> joe.Assign({target, value}))
        @catchVar = @catchVar ? joe.Undetermined('err')
        return joe.Block([this, target.toJSNode($, {toValue,inject})])
      else
        @catchVar = @catchVar ? joe.Undetermined('err')
        return @childrenToJSNode($)
    toJavascript: -> "try {#{js @block, isValue:yes}}#{
      (@catchVar? or @catch?) and " catch(#{js(@catchVar) or ''}) {#{js @catch}}" or ''}#{
      @finally and "finally {#{js @finally}}" or ''}"

  joe.Loop::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      if toValue or inject
        lines = []
        # <Variable> = []
        lines.push joe.Assign target:(target=joe.Undetermined('accum')), value:joe.Arr()
        # @label:
        # while(@cond) {
        #   <Variable>.push(@block)
        # }
        @block = @block.toJSNode($, {inject:(value)->
          joe.Invocation
            func:   joe.Index(obj:target, key:joe.Word('push'))
            params: [joe.Item {value}]
        })
        lines.push this
        # <Variable>
        lines.push target.toJSNode($, {toValue,inject})
        return joe.Block(lines)
      else
        return @childrenToJSNode($)
    toJavascript: -> "while(#{js @cond, isValue:yes}) {#{js @block}}"

  joe.JSForC::extend
    toJavascript: -> "for(#{js @setup, withCommas:yes}; #{js @cond, isValue:yes}; #{js @counter, withCommas:yes}){#{js @block}}"

  joe.JSForK::extend
    toJavascript: -> "for(#{js @key} in #{js @obj, isValue:yes}){#{js @block}}"

  joe.For::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      if toValue or inject
        # call Loop.toJSNode to accumuate.
        accum = @super.toJSNode.call(@, $, {toValue,inject})
        # finally call this function again.
        return accum.toJSNode($)

      switch @type
        when 'in' # Array iteration
          if @obj instanceof joe.Range
            setup = joe.Block compact [
              # for (@keys[1] = 0,
              joe.Assign(target:_i=@keys[1], value:0) if @keys[1]?
              #   @keys[0] = @obj.from,
              joe.Assign(target:_val=@keys[0], value:@obj.from ? 0)
              #   _to = @obj.to ? undefined
              joe.Assign(target:_to=joe.Undetermined('_to'), value:(@obj.to ? joe.Singleton.undefined))
              #   _by = @obj.by ? 1;
              joe.Assign(target:_by=joe.Undetermined('_by'), value:(@obj.by ? 1))
            ]
            cond = joe.Operation left:@keys[0], op:(if @obj.exclusive then '<' else '<='), right:_to
            counter = joe.Block compact [
              joe.Assign(target:_i, type:'+=', value:1) if @keys[1]?
              joe.Assign(target:_val, type:'+=', value:_by)
            ]
            block =
              if @cond?
                joe.If(cond:@cond, block:@block)
              else
                @block
          else
            setup = joe.Block compact [
              # _obj = <?>
              joe.Assign(target:_obj=joe.Undetermined('_obj'), value:@obj),
              if @keys.length > 1
                # for (@keys[1] = _i = 0; ...
                joe.Assign(target:@keys[1], value:joe.Assign(target:_i=joe.Undetermined('_i'), value:0))
              else
                # for (_i = 0; ...
                joe.Assign(target:_i=joe.Undetermined('_i'), value:0)
              ,
              # _len = <?>
              joe.Assign(target:_len=joe.Undetermined('_len'), value:joe.Index(obj:_obj, key:joe.Word('length'), type:'.')),
            ]
            # _i < _len; ...
            cond = joe.Operation left:_i, op:'<', right:_len
            counter =
              if @keys.length > 1
                # @keys[1] = _i++)
                joe.Assign(target:@keys[1], value:joe.Operation(left:_i, op:'++'))
              else
                # _i++)
                joe.Operation(left:_i, op:'++')
            block = joe.Block [
              # @keys[0] = _obj[_i]
              joe.Assign(target:@keys[0], value:joe.Index(obj:_obj, key:_i, type:'[')),
              if @cond?
                # if (@cond) { @block }
                joe.If(cond:@cond, block:@block)
              else
                @block
            ]
          node = joe.JSForC label:@label, block:block, setup:setup, cond:cond, counter:counter
          return node.childrenToJSNode($)

        when 'of' # Object iteration
          return joe.Block([
            joe.Assign(target:_obj=joe.Undetermined('_obj'), value:@obj),
            joe.JSForK(label:@label, key:@keys[0], obj:_obj, block:joe.Block(compact [
                if @keys[1]
                  joe.Assign(target:@keys[1], value:joe.Index(obj:_obj, type:'[', key:@keys[0]))
                else
                  undefined
                if @cond?
                  # if (@cond) { @block }
                  joe.If(cond:@cond, block:@block)
                else
                  @block
              ])
            )
          ]).childrenToJSNode($)
          
        else throw new Error "Unexpected For type #{@type}"
      # end switch
      assert.ok no, 'should not happen'

  joe.Switch::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      if toValue or inject
        # @obj @cases @default
        lines = []
        # <Variable> = undefined
        lines.push joe.Assign target:(target=joe.Undetermined('temp')), value:joe.Singleton.undefined
        # switch(@obj) { case(case.matches) { <Variable> = case.block } for case in @cases }
        @obj = @obj.toJSNode($, toValue:yes)
        @cases = for _case in @cases then _case.toJSNode($, inject:(value)->joe.Assign({target,value}))
        @default = @default?.toJSNode($, inject:(value) -> joe.Assign({target,value}))
        lines.push this
        # <Variable>
        lines.push target.toJSNode($, {toValue,inject})
        return joe.Block(lines)
      else
        return @childrenToJSNode($)
    toJavascript: ->
      """
        switch (#{js(@obj, isValue:yes)}) {
          #{(js(_case) for _case in @cases||[]).join('')}
          default:
            #{if @default? then js(@default) else 'undefined'}
        }
      """

  joe.Case::extend
    toJSNode: mark ($, {inject}={}) ->
      @matches = for match in @matches then match.toJSNode($, {toValue:yes})
      @block = @block.toJSNode($, {inject})
      return @
    toJavascript: ->
      """#{("case #{js(match)}:\n" for match in @matches).join('')
        }#{js(@block)}; break;\n"""

  TO_JS_OPS = {'is':'===', '==':'===', 'isnt':'!==', '!=':'!==', 'or':'||', 'and':'&&', 'not':'!'}
  joe.Operation::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      switch @op
        when '?'
          return (inject ? identity) @left.withSoak((ref) =>
            block: ref,
            else: @right
          ).toJSNode($, {toValue,inject})
        when '++','--'
          if @left?
            if toValue
              return joe.Operation(left:joe.Assign(target:@left, op:'+', value:1).toJSNode($, {toValue:yes}), op:'-', right:1) if @op is '++'
              return joe.Operation(left:joe.Assign(target:@left, op:'-', value:1).toJSNode($, {toValue:yes}), op:'+', right:1)
            else
              return joe.Assign(target:@left, op:'+', value:1).toJSNode($, {toValue:yes}) if @op is '++'
              return joe.Assign(target:@left, op:'-', value:1).toJSNode($, {toValue:yes})
          else
            return joe.Assign(target:@right, op:'+', value:1).toJSNode($, {toValue:yes}) if @op is '++'
            return joe.Assign(target:@right, op:'-', value:1).toJSNode($, {toValue:yes})
        else return (inject ? identity) @childrenToJSNode($)
    toJavascript: -> "(#{ if @left?  then js(@left, isValue:yes)+' '  else ''
                      }#{ TO_JS_OPS[@op] ? @op
                      }#{ if @right? then ' '+js(@right, isValue:yes) else '' })"

  joe.Statement::extend
    toJavascript: -> "#{@type} #{if @expr? then js(@expr, isValue:yes) else ''}"

  joe.Assign::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      return unsoaked.toJSNode($, {toValue,inject}) unless (unsoaked=@unsoak()) is this
      assert.ok not (@target instanceof joe.AssignObj and @op?), "Destructuring assignment with op?"
      if @target instanceof joe.AssignObj
        lines = []
        if isVariable @value
          valueVar = @value
        else
          valueVar = joe.Undetermined('temp')
          lines.push joe.Assign target:valueVar, value:@value.toJSNode($, toValue:yes)
        @target.destructLines lines, valueVar
        lines.push valueVar.toJSNode($, {toValue,inject}) if toValue or inject
        return joe.Block(lines)
      else if @op?
        if isVariable(@target) or isIndex(@target) and isVariable(@target.obj)
          # Simple like `x += 1` or `foo.bar += 1`.
          # But, anything more complex like `foo.bar.baz += 1` or
          # `(foo = {bar:1}; foo).bar += 1` requires a translation to avoid side effects.
          @value = joe.Operation(left:@target, op:@op, right:@value).toJSNode($, toValue:yes)
          @op = undefined
          return (inject ? identity)(@) # nore toJSNode() necessary.
        else
          # something.complex.baz += @value
          #   .. becomes ..
          # baseVar = something.complex
          # baseVar.baz = baseVar + @value
          lines = []
          baseObj = @target.obj
          baseVar = joe.Undetermined('baseObj')
          lines.push joe.Assign(target:baseVar, value:baseObj)
          baseIndex = joe.Index(obj:baseVar, key:@target.key, type:@target.type)
          opValue = joe.Operation(left:baseIndex, op:@op, right:@value)
          lines.push joe.Assign(target:baseIndex, value:opValue)
          return joe.Block(lines).toJSNode($, {toValue,inject})
      else
        return @childrenToJSNode($)
    toJavascript: ({isValue}={}) ->
      if isValue
        "(#{js @target} #{@op or ''}= #{js @value, isValue:yes})"
      else
        "#{js @target} #{@op or ''}= #{js @value, isValue:yes}"

  joe.AssignObj::extend
    # lines:    The array into which assignment nodes will be pushed
    # source:   The source for destructuring assignment
    # CONTRACT: Input source and output lines are javascript.
    destructLines: (lines, source) ->
      for item in @items
        target   = item.target ? item.key
        key      = item.key
        default_ = item.default
        if target instanceof joe.Word or target instanceof joe.Index
          lines.push joe.Assign target:target, value:joe.Index(obj:source, key:key)
          lines.push joe.Assign target:target, value:default_, type:'?=' if default_?
        else if target instanceof joe.AssignObj
          temp = joe.Undetermined '_assign'
          lines.push joe.Assign target:temp, value:joe.Index(obj:source, key:key)
          lines.push joe.Assign target:temp, value:default_, type:'?=' if default_?
          target.destructLines lines, temp
        else
          throw new Error "Unexpected AssignObj target: #{target} (#{target?.constructor.name})"
      return

  joe.AssignList::extend
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
          joe.AssignList::destructItem lines, source, target, key, default_
        splatItem = @items[splatIndex]
        lines.push joe.Assign
          target: splatItem.target
          value: joe.If(
            cond: joe.Operation
              left: @items.length
              op: '<='
              right: joe.Index(obj:source, key:joe.Word('length'))
            block: joe.Invocation
              func: joe.Index(obj:source, key:joe.Word('slice'))
              params: compact [
                joe.Item(value:numHeads),
                if numTails
                  joe.Item(value:joe.Assign
                    target: _i=joe.Undetermined('_i')
                    value: joe.Operation
                      left: joe.Index(obj:source, key:joe.Word('length'))
                      op: '-'
                      right: numTails
                  )
              ]
            else:
              if numTails
                joe.Block [
                  joe.Assign(target:_i, value:numHeads),
                  joe.Arr()
                ]
              else joe.Arr()
          )
        for i in [splatIndex+1...@items.length]
          item = @items[i]
          [target, key, default_] = [item.target, joe.Operation(left:_i, op:'++'), item.default]
          joe.AssignList::destructItem lines, source, target, key, default_
      else
        for item, i in @items
          [target, key, default_] = [item.target, i, item.default]
          joe.AssignList::destructItem lines, source, target, key, default_
      return
    destructItem: (lines, source, target, key, default_) ->
      if target instanceof joe.Word or target instanceof joe.Index
        lines.push joe.Assign target:target, value:joe.Index(obj:source, key:key)
        lines.push joe.Assign target:target, value:default_, type:'?=' if default_?
      else if target instanceof joe.AssignObj
        temp = joe.Undetermined '_assign'
        lines.push joe.Assign target:temp, value:joe.Index(obj:source, key:key)
        lines.push joe.Assign target:temp, value:default_, type:'?=' if default_?
        target.destructLines lines, temp
      else
        throw new Error "Unexpected AssignObj target: #{target} (#{target?.constructor.name})"
    # Used by `do (param1, param2, ...) -> ...` constructs.
    # Returns an array of Items, suitable invocation parameters.
    extractWords: ->
      words = []
      for item, i in @items
        assert.ok item.target instanceof joe.Word, "extractKeys() wants words."
        words.push item.target
      return (joe.Item(key:undefined, value:word) for word in words)

  joe.Str::extend
    getParts: ->
      return [this] if typeof @parts is 'string'
      nodes = []
      for part in @parts
        if part instanceof joe.Node
          nodes.push '' if nodes.length is 0 # must start with a string.
          nodes.push part
        else
          nodes.push ''+part
      return nodes
      
    toJSNode: mark ($) ->
      node = undefined
      # construct a '+' operation with the @parts.
      for part in @getParts() when (node is undefined) or part
        if node is undefined
          node = part
          continue
        else
          node = joe.Operation left:node, op:'+', right:part
      return node?.toJSNode($) or ''
        
    # toJavascript: -> should have been converted to strings, nodes, and + operations.

  joe.Func::extend
    toJSNode: mark ($) ->
      ## TODO bind to this for '=>' @type binding
      ## destructuring parameters
      if @params?
        lines = []
        for param, i in @params.items
          {target, default:_default} = param
          param.default = undefined # javascript doesn't support default param values.
          if not isVariable target
            if target instanceof joe.AssignObj
              arg = joe.Undetermined('arg')
              @params.items[i] = joe.AssignItem target:arg
              lines.push joe.Assign target:arg, op:'?', value:_default if _default?
              target.destructLines lines, arg
            else if target instanceof joe.Index
              assert.ok target.isThisProp, "Unexpected parameter target #{target}"
              arg = joe.Word(''+target.key)
              @params.items[i] = joe.AssignItem target:arg
              lines.push joe.Assign target:arg, op:'?', value:_default if _default?
              lines.push joe.Assign target:target, value:arg
            else
              throw new Error "Unexpected parameter target #{target}"
          else
            lines.push joe.Assign target:target, op:'?', value:_default if _default?
        @block.lines[...0] = lines
      ## make last line return
      @block = @block?.toJSNode($, {inject:(value)->
        joe.Statement(type:'return', expr:value)
      })
      return this
    toJavascript: ->
      "(function#{ if @params? then '('+@params.toString(no)+')' else '()'} {#{if @block? then js @block else ''}})"

  # NOTE: not to be produced in toJSNode, which is interpreted by src/interpreter.
  joe.NativeExpression::extend
    toJavascript: -> @exprStr

  joe.Singleton::extend
    toJavascript: -> @name

  joe.Invocation::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      return unsoaked.toJSNode($, {toValue,inject}) unless (unsoaked=@unsoak()) is this
      if @func instanceof joe.Word and @func.key is 'do' # do (...) -> ..
        assert.ok @params.length is 1 and @params[0].value instanceof joe.Func, "Joescript `do` wants one function argument"
        @func = @params[0].value.toJSNode($, toValue:yes)
        @params = @func.params.extractWords()
        return (inject ? identity)(@)
      else
        @func = @func.toJSNode($, toValue:yes)
        @params.map (p) -> p.value = p.value.toJSNode($, toValue:yes)
        return (inject ? identity)(@)
    toJavascript: ->
      "#{js @func, isValue:yes}(#{@params.map (p)->js(p.value)})"

  joe.Index::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      return unsoaked.toJSNode($, {toValue,inject}) unless (unsoaked=@unsoak()) is this
      return @super.toJSNode.call(@, $, {toValue,inject})
    toJavascript: ->
      if @type is '?'
        if @key.toKeyString() is 'type'
          return "typeof #{js @obj}"
      close = if @type is '[' then ']' else ''
      "#{js @obj, isValue:yes}#{@type}#{js @key}#{close}"

  joe.Obj::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      if @items?
        for item in @items
          item.key = item.key?.toJSNode($, toValue:yes)
          if item.value?
            item.value = item.value.toJSNode($, toValue:yes)
          else
            item.value = item.key
      return (inject ? identity)(@) # nore toJSNode() necessary.
    toJavascript: ->
      return '{}' unless @items?
      "{#{("#{js key}: #{js value, isValue:yes}" for {key, value} in @items).join ', '}}"

  joe.Arr::extend
    toJavascript: ->
      return '[]' unless @items?
      # TODO need to handle splats...
      "[#{(js value, isValue:yes for {key, value} in @items).join ', '}]"

  joe.Slice::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      return unsoaked.toJSNode($, {toValue,inject}) unless (unsoaked=@unsoak()) is this
      return joe.Invocation(
        func: joe.Index(obj:@obj, key:'slice', type:'.')
        params: [
          joe.Item(value:@range.from ? joe.Singleton.undefined),
          (if @range.to?
            if @range.exclusive
              joe.Item(value:@range.to)
            else
              joe.Item(value:joe.Operation(left:1, op:'+', right:@range.to))
          else
            joe.Item(value:joe.Singleton.undefined)),
          joe.Item(value:@range.by   ? joe.Singleton.undefined) # TODO not supported in js.
        ]
      ).toJSNode($, {toValue,inject})

  joe.Soak::extend
    toJSNode: mark ($, {toValue,inject}={}) ->
      return unsoaked.toJSNode($, {toValue,inject}) unless (unsoaked=@unsoak()) is this
      return @obj.withSoak().toJSNode($, {toValue,inject})
    toJavascript: ->
      throw new Error "Should not happen, soak is not Javascript."

  joe.Heredoc::extend
    toJavascript: ->
      text = @text
      length = text.length
      loop
        text = text.replace(/\*\//g, '* /')
        break if text.length is length
        length = text.length
      return "/*#{text}*/"

  clazz.extend String,
    toJavascript: -> '"' + escape(@) + '"'

  clazz.extend Object, # Number, String, and Boolean
    toJSNode: mark ($, {inject}={}) -> inject?(@valueOf()).toJSNode($) ? @valueOf()
    toJavascript: -> ''+@
    withSoak: (fn) ->
      cond = joe.Operation(
        left:joe.Operation(
          left: joe.Index(obj:@valueOf(), type:'?', key:joe.Word('type'))
          op:   '!='
          right:"undefined"
        ),
        op: '&&'
        right:joe.Operation(
          left: @valueOf()
          op:   '!='
          right:joe.Singleton.null
        )
      )
      if fn?
        {block,else:else_}= fn(@valueOf())
        return joe.If(
          cond:  cond,
          block: block,
          else:  else_
        )
      else
        return cond

@translate = translate = (node,$=undefined) ->
  node.validate()
  install()
  node = node.
    toJSNode($).
    liftBlocks($).
    installScope().
    determine().
    validate()
  #return node.toJavascript()
  js_raw = node.toJavascript()
  try
    js_ast = uglify.parser.parse("(function(){#{js_raw}})")
  catch error
    console.log red "Error in uglify.parser.parse(): #{error.stack ? error}\njs_raw:#{js_raw}"
    throw error
  js_pretty = uglify.uglify.gen_code(js_ast, beautify:yes)
  #console.log green js_pretty[14...-4]
  return js_pretty[14...-4]
