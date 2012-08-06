###

# AST Transformation

  This is responsible for translating a JoeScript AST into valid Javascript AST.
  Actually, the result needs to be a subset of Javascript so as to be interpretable
  from the sembly/src/interpreter. (this may change in the future).

  Here are the properties of RJavascript. (Restricted Javascript).

  1. No operational-assignments like +=, *=, etc
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

  NOTE: By convention, when 'inject' is present, always set toValue to true.
  NOTE: Consider the impact of always "injecting", which may lead to bloat.
    It would be nice to have some other mechanisms, like injecting assignments
    into a temp var, and injecting a statement or invocation only to the temp var
    in the last line of a block, as necessary... I dunno.

###

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'

{
  NODES:joe
  HELPERS:{isVariable,isIndex}
} = require 'sembly/src/joescript'
{escape, compact, flatten} = require('sembly/lib/helpers')

js = (obj) -> obj.toJavascript()
identity = (x) -> x

trigger = (obj, msg) -> if obj instanceof joe.Node then obj.trigger(msg) else obj

@install = install = ->
  return if joe.Node::toJSNode? # already defined.
  require('sembly/src/translators/scope').install() # dependency

  joe.Node::extend
    toJSNode: ({toValue,inject}={}) ->
      if inject and this not instanceof joe.Statement
        return inject(this).toJSNode()
      else
        return @childrenToJSNode()
    # Convenience method, if you want to automatically .toJSNode children.
    # Most of the time you want to do that manually.
    childrenToJSNode: ->
      that = this
      @withChildren (child, parent, key, desc, index) ->
        if index?
          that[key][index] = child.toJSNode toValue:desc.isValue
        else
          that[key] = child.toJSNode toValue:desc.isValue
      @
    toJavascript: ->
      throw new Error "#{@constructor.name}.toJavascript not defined"
    hasStatement$: get: ->
      if @ instanceof joe.Statement
        @hasStatement = yes
        return yes
      hasStatement = no
      @withChildren (child) ->
        return if child not instanceof joe.Node
        if child.hasStatement
          hasStatement = yes
      return @hasStatement=hasStatement
    # Calls fn with a variable that holds a ref to this node value,
    # fn should return {block,else} which gets set on the resulting If node.
    withSoak: (fn) ->
      ref = joe.Undetermined('ref')
      {block,else:else_}= fn(ref)
      return joe.If(
        cond:joe.Operation(
          left: joe.Operation(
            left: joe.Assign(target:ref,value:this),
            op:   '!='
            right:joe.Singleton.null
          ),
          op: 'and'
          right: joe.Operation(
            left: joe.Assign(target:ref,value:this),
            op:   '!='
            right:joe.Singleton.undefined
          )
        )
        block: block,
        else:  else_
      )

    # Translates a potentially soakful value (or assignment) into an If block.
    unsoak: (force=no) ->
      return if @unsoaked and not force
      # first, find leftmost soak.
      soakContainer = undefined
      soak = undefined
      cursor = this
      loop
        if cursor.soakable instanceof joe.Soak
          soakContainer = cursor
          soak = cursor.soakable
        cursor.unsoaked = yes
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
          return block:@unsoak(yes), else:joe.Singleton.undefined
      else
        return @

  joe.Word::extend
    toJavascript: ->
      ''+this
    withSoak: (fn) ->
      {block,else:else_}= fn(@)
      return joe.If(
        cond:joe.Operation(
          left:joe.Operation(
            left: joe.Index(obj:@, type:'?', key:'type')
            op:   '!='
            right:joe.Singleton.null
          ),
          op: '&&'
          right:joe.Operation(
            left: @
            op:   '!='
            right:joe.Singleton.undefined
          )
        )
        block: block,
        else:  else_
      )

  joe.Undetermined::extend
    toJavascript: -> throw new Error "Shouldn't happen..."

  joe.Block::extend
    toJSNode: ({toValue,inject}={}) ->
      @isValue = toValue
      for line, i in @lines
        if i < @lines.length-1
          @lines[i] = line.toJSNode()
        else
          @lines[i] = line.toJSNode({toValue,inject})
      @
    toJavascript: ->
      if @ownScope? and (toDeclare=@ownScope.nonparameterVariables)?.length > 0
        lines = [joe.NativeExpression("var #{toDeclare.map((x)->x.toKeyString?() ? x).join(', ')}"), @lines...]
      else
        lines = @lines
      if @isValue and @lines.length > 1
        "(#{(js(line) for line in lines).join '; '})"
      else
        (js(line) for line in lines).join ';\n'

  joe.If::extend
    toJSNode: ({toValue,inject}={}) ->
      @isValue = toValue
      @cond = @cond.toJSNode(toValue:yes)
      @block = @block.toJSNode {toValue,inject}
      @else = @else?.toJSNode {toValue,inject} if @else?
      @
    toJavascript: ->
      if @isValue and not @hasStatement
        if @else?
          "(#{js @cond} ? #{js @block} : #{js @else})"
        else
          "(#{js @cond} ? #{js @block} : undefined)"
      else
        if @else?
          "if(#{js @cond}){#{js @block}}else{#{js @else}}"
        else
          "if(#{js @cond}){#{js @block}}"

  joe.Try::extend
    toJSNode: ({toValue,inject}={}) ->
      if toValue or inject
        target = joe.Undetermined('temp')
        @block = joe.Assign(target:target, value:@block).toJSNode()
        @catch = joe.Assign(target:target, value:@catch).toJSNode() if @catch?
        return joe.Block [this, target.toJSNode({toValue,inject})]
      else
        return @childrenToJSNode()
    toJavascript: -> "try {#{js @block}}#{
      (@catchVar? or @catch?) and " catch(#{js(@catchVar) or ''}) {#{js @catch}}" or ''}#{
      @finally and "finally {#{js @finally}}" or ''}"

  joe.Loop::extend
    toJSNode: ({toValue,inject}={}) ->
      if toValue or inject
        lines = []
        # <Variable> = []
        lines.push joe.Assign target:(target=joe.Undetermined('accum')), value:joe.Arr()
        # @label:
        # while(@cond) {
        #   <Variable>.push(@block)
        # }
        @block = @block.toJSNode({toValue:yes, inject:(value)->
          joe.Invocation
            func:   joe.Index(obj:target, key:joe.Word('push'))
            params: [joe.Item {value}]
        })
        lines.push this
        # <Variable>
        lines.push target.toJSNode({toValue,inject})
        return joe.Block lines
      else
        return @childrenToJSNode()
    toJavascript: -> "while(#{js @cond}) {#{js @block}}"

  joe.JSForC::extend
    toJavascript: -> "for(#{js @setup};#{js @cond};#{js @counter}){#{js @block}}"

  joe.For::extend
    toJSNode: ({toValue,inject}={}) ->
      if toValue or inject
        # call Loop.toJSNode to accumuate.
        accum = @super.toJSNode.call(@, {toValue,inject})
        # finally call this function again.
        return accum.toJSNode()

      switch @type
        when 'in' # Array iteration
          setup = joe.Block compact [
            joe.Assign(target:_obj=joe.Undetermined('_obj'), value:@obj),
            if @keys.length > 1
              # for (@keys[1] = _i = 0; ...
              joe.Assign(target:@keys[1], value:
                joe.Assign(target:_i=joe.Undetermined('_i'), value:0))
            else
              # for (_i = 0; ...
              joe.Assign(target:_i=joe.Undetermined('_i'), value:0)
            ,
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
            joe.Assign(target:@keys[0], value:joe.Index(obj:_obj, key:_i, type:'[')),
            if @cond?
              # if (@cond) { @block }
              joe.If(cond:@cond, block:@block)
            else
              @block
          ]
          node = joe.JSForC label:@label, block:block, setup:setup, cond:cond, counter:counter
          return node.childrenToJSNode()

        when 'of' # Object iteration
          # for (@keys[0] in @obj)
          key = @keys[0]
          block = joe.Block compact [
            joe.Assign(target:_obj=joe.Undetermined('_obj'), value:@obj),
            joe.Assign(target:@keys[1], value:joe.Index(obj:_obj, key:key)) if @keys[1],
            if @cond?
              # if (@cond) { @block }
              joe.If(cond:@cond, block:@block)
            else
              @block
          ]
          node = joe.JSForK label:@label, block:@block, key:key, obj:_obj
          return node.childrenToJSNode()
          
        else throw new Error "Unexpected For type #{@type}"
      # end switch
      assert.ok no, 'should not happen'

  joe.Switch::extend
    toJSNode: ({toValue,inject}={}) ->
      if toValue or inject
        # @obj @cases @default
        lines = []
        # <Variable> = undefined
        lines.push joe.Assign target:(target=joe.Undetermined('temp')), value:joe.Singleton.undefined
        # switch(@obj) { case(case.matches) { <Variable> = case.block } for case in @cases }
        for _case in @cases
          _case.block = joe.Assign(target:target, value:_case.block).toJSNode(toValue:yes)
        lines.push this
        # <Variable>
        lines.push target.toJSNode({toValue,inject})
        return joe.Block lines
      else
        return @childrenToJSNode()

  TO_JS_OPS = {'is':'===', '==':'===', 'isnt':'!==', '!=':'!=='}
  joe.Operation::extend
    toJSNode: ({toValue,inject}={}) ->
      switch @op
        when '?'
          return (inject ? identity) @left.withSoak((ref) =>
            block: ref,
            else: @right
          ).toJSNode({toValue,inject})
        else return (inject ? identity) @childrenToJSNode()
    toJavascript: -> "(#{ if @left?  then js(@left)+' '  else ''
                      }#{ TO_JS_OPS[@op] ? @op
                      }#{ if @right? then ' '+js(@right) else '' })"

  joe.Statement::extend
    toJavascript: -> "#{@type} #{if @expr? then js(@expr) else ''}"

  joe.Assign::extend
    toJSNode: ({toValue,inject}={}) ->
      return @unsoak().toJSNode({toValue,inject}) unless @unsoaked
      @isValue or= toValue
      if @op?
        if isVariable(@target) or isIndex(@target) and isVariable(@target.obj)
          # Simple like `x += 1` or `foo.bar += 1`.
          # But, anything more complex like `foo.bar.baz += 1` or
          # `(foo = {bar:1}; foo).bar += 1` requires a translation
          @value = joe.Operation(left:@target, op:@op, right:@value.toJSNode(toValue:yes))
          @op = undefined
          return inject(this) if inject?
          return @ # no more toJSNode() necessary.
        else
          ###
          something.complex.baz += @value ~~>
            baseVar = something.complex
            baseVar.baz = baseVar + @value
          ###
          lines = []
          baseObj = @target.obj
          baseVar = joe.Undetermined('baseObj')
          lines.push joe.Assign(target:baseVar, value:baseObj)
          baseIndex = joe.Index(obj:baseVar, key:@target.key, type:@target.type)
          opValue = joe.Operation(left:baseIndex, op:@op, right:@value)
          lines.push joe.Assign(target:baseIndex, value:opValue)
          return joe.Block(lines).toJSNode({toValue,inject})

      else if @target instanceof joe.AssignObj
        lines = []
        if isVariable @value
          valueVar = @value
        else
          valueVar = joe.Undetermined('temp')
          lines.push joe.Assign target:valueVar, value:@value.toJSNode(toValue:yes)
          @value = valueVar # XXX I think this line is unnecessary
        @target.destructLines valueVar, lines
        lines.push valueVar.toJSNode({toValue,inject}) if toValue or inject
        return joe.Block(lines)
      else
        return @childrenToJSNode()
    toJavascript: ->
      if @isValue
        "(#{js @target} #{@op or ''}= #{js @value})"
      else
        "#{js @target} #{@op or ''}= #{js @value}"

  joe.AssignObj::extend
    # source:   The source for destructuring assignment
    # lines:    The array into which assignment nodes will be pushed
    # CONTRACT: Input source and output lines are javascript.
    destructLines: (source, lines) ->
      lines ?= []
      for item, i in @items
        target   = item.target ? item.key
        key      = item.key ? i
        default_ = item.default
        if target instanceof joe.Word or target instanceof joe.Index
          lines.push joe.Assign target:target, value:joe.Index(obj:source, key:key)
          lines.push joe.Assign target:target, value:default_, type:'?=' if default_?
        else if target instanceof joe.AssignObj
          temp = joe.Undetermined '_assign'
          lines.push joe.Assign target:temp, value:joe.Index(obj:source, key:key)
          lines.push joe.Assign target:temp, value:default_, type:'?=' if default_?
          target.destructLines temp, lines
        else
          throw new Error "Unexpected AssignObj target: #{target} (#{target?.constructor.name})"
      return

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
      
    toJSNode: ->
      node = undefined
      # construct a '+' operation with the @parts.
      for part in @getParts() when (node is undefined) or part
        if node is undefined
          node = part
          continue
        else
          node = joe.Operation left:node, op:'+', right:part
      return node?.toJSNode() or ''
        
    # toJavascript: -> should have been converted to strings, nodes, and + operations.

  joe.Func::extend
    toJSNode: ->
      ## TODO bind to this for '=>' @type binding
      ## destructuring parameters
      if @params?
        destructs = []
        for {target:param}, i in @params.items
          if not isVariable param
            if param instanceof joe.AssignObj
              arg = joe.Undetermined('arg')
              @params.items[i] = joe.AssignItem target:arg
              param.destructLines arg, destructs
            else if param instanceof joe.Index
              assert.ok param.isThisProp, "Unexpected parameter #{param}"
              key = joe.Word(''+param.key)
              @params.items[i] = joe.AssignItem target:key
              destructs.push joe.Assign target:param, value:key
            else
              throw new Error "Unexpected parameter #{param}"
        @block.lines[...0] = destructs
      ## make last line return
      @block = @block?.toJSNode({toValue:yes, inject:(value)->
        joe.Statement(type:'return', expr:value)
      })
      return this
    toJavascript: ->
      "function#{ if @params? then '('+@params.toString(no)+')' else '()'} {#{if @block? then js @block else ''}}"

  # NOTE: not to be produced in toJSNode, which is interpreted by src/interpreter.
  joe.NativeExpression::extend
    toJavascript: -> @exprStr

  joe.Singleton::extend
    toJavascript: -> @name

  joe.Invocation::extend
    toJSNode: ({toValue,inject}={}) ->
      return @unsoak().toJSNode({toValue,inject}) unless @unsoaked
      @func = @func.toJSNode(toValue:yes)
      @params.map (p) ->
        p.value = p.value.toJSNode(toValue:yes)
      return inject?(@) ? @
    toJavascript: ->
      "#{js @func}(#{@params.map (p)->js(p.value)})"

  joe.Index::extend
    toJSNode: ({toValue,inject}={}) ->
      return @unsoak().toJSNode({toValue,inject}) unless @unsoaked
      return @super.toJSNode.call(@, {toValue,inject})
    toJavascript: ->
      close = if @type is '[' then ']' else ''
      "#{js @obj}#{@type}#{js @key}#{close}"

  joe.Obj::extend
    toJavascript: ->
      return '{}' unless @items?
      "{#{("\"#{escape key}\": #{js value}" for {key, value} in @items).join ', '}}"

  joe.Arr::extend
    toJavascript: ->
      return '[]' unless @items?
      # TODO need to handle splats...
      "[#{(js value for {key, value} in @items).join ', '}]"

  joe.Slice::extend
    toJSNode: ({toValue,inject}={}) ->
      return @unsoak().toJSNode({toValue,inject}) unless @unsoaked
      return joe.Invocation(
        func: joe.Index(obj:@obj, key:'slice')
        params: [
          joe.Item(value:@range.from ? joe.Singleton.undefined),
          joe.Item(value:@range.to   ? joe.Singleton.undefined),
          joe.Item(value:@range.by   ? joe.Singleton.undefined) # TODO not supported in js.
        ]
      ).toJSNode({toValue,inject})

  joe.Soak::extend
    toJSNode: ({toValue,inject}={}) ->
      return @unsoak().toJSNode({toValue,inject}) unless @unsoaked
      return @obj.withSoak( (ref) =>
        block:true,
        else:false
      ).toJSNode({toValue,inject})
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

  clazz.extend Boolean,
    toJSNode: ({inject}={}) -> inject?(@).toJSNode() ? @
    toJavascript: -> ''+@

  clazz.extend String,
    toJSNode: ({inject}={}) -> inject?(@).toJSNode() ? @
    toJavascript: -> '"' + escape(@) + '"'

  clazz.extend Number,
    toJSNode: ({inject}={}) -> inject?(@).toJSNode() ? @
    toJavascript: -> ''+@

@translate = translate = (node) ->
  # console.log node.serialize() # print before translations...
  # install plugin
  node.validate()
  install()
  node = node.toJSNode().installScope().determine()
  node.validate()
  return node.toJavascript()
