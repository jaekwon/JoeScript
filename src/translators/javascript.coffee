{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'

joe = require('joeson/src/joescript').NODES
{extend, isWord, isVariable} = require('joeson/src/joescript').HELPERS
{escape, compact, flatten} = require('joeson/lib/helpers')

js = (obj) -> obj?.toJavascript?() ? obj

trigger = (obj, msg) -> if obj instanceof joe.Node then obj.trigger(msg) else obj

@install = install = ->
  return if joe.Node::toJSNode? # already defined.
  require('joeson/src/translators/scope').install() # dependency

  joe.Node::extend
    toJSNode: ({toValue,toReturn}={}) ->
      if toReturn and this not instanceof joe.Statement
        return joe.Statement(type:'return', expr:this).toJSNode()
      else
        return @childrenToJSNode()
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

  joe.Word::extend
    toJavascript: ->
      ''+this

  joe.Block::extend
    toJSNode: ({toValue,toReturn}={}) ->
      @isValue = toValue
      for line, i in @lines
        if i < @lines.length-1
          @lines[i] = @lines[i].toJSNode()
        else
          @lines[i] = @lines[i].toJSNode({toValue,toReturn})
      @
    toJavascript: ->
      if @ownScope? and (toDeclare=@ownScope.nonparameterVariables)?.length > 0
        lines = [joe.NativeExpression("var #{toDeclare.map((x)->''+x).join(', ')}"), @lines...]
      else
        lines = @lines
      if @isValue and @lines.length > 1
        "(#{(js(line) for line in lines).join '; '})"
      else
        (js(line) for line in lines).join ';\n'

  joe.If::extend
    toJSNode: ({toValue,toReturn}={}) ->
      @isValue = toValue
      @hasStatement or= toReturn
      @cond = @cond.toJSNode(toValue:yes)
      @block = @block.toJSNode {toValue,toReturn}
      @else = @else.toJSNode {toValue,toReturn} if @else?
      @
    # NOTE: cached. never uncached.
    hasStatement$: get: ->
      if @ instanceof joe.Statement
        @hasStatement = yes
        return yes
      hasStatement = no
      @withChildren (child) ->
        return if child not instanceof joe.Node
        if child.hasStatement
          hasStatement = yes
        # no way to exit iteration early.
      return @hasStatement=hasStatement
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
    toJSNode: ({toValue,toReturn}={}) ->
      if toValue or toReturn
        target = joe.Undetermined('temp')
        @block = joe.Assign(target:target, value:@block).toJSNode()
        @catch = joe.Assign(target:target, value:@catch).toJSNode() if @catch?
        return joe.Block [this, target.toJSNode({toReturn})]
      else
        return @
    toJavascript: -> "try {#{js @block}}#{
      (@catchVar? or @catch?) and " catch(#{js(@catchVar) or ''}) {#{js @catch}}" or ''}#{
      @finally and "finally {#{js @finally}}" or ''}"

  joe.Loop::extend
    toJSNode: ({toValue,toReturn}={}) ->
      if toValue or toReturn
        lines = []
        # <Variable> = []
        lines.push joe.Assign target:(target=joe.Undetermined('accum')), value:joe.Arr()
        # @label:
        # while(@cond) {
        #   <Variable>.push(@block)
        # }
        @block = joe.Invocation(func:joe.Index(obj:target,key:joe.Word('push')), params:[joe.Item(value:@block)]).toJSNode()
        lines.push this
        # <Variable>
        lines.push target.toJSNode({toReturn})
        return joe.Block lines
      else
        return this
    toJavascript: -> "while(#{js @cond}) {#{js @block}}"

  joe.For::extend
    toJSNode: ({toValue,toReturn}={}) ->
      if toValue or toReturn
        # call Loop.toJSNode to accumuate.
        accum = @super.toJSNode.call(@, toValue:toValue,toReturn:toReturn)
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
            joe.Assign(target:@keys[0], value:joe.Index(obj:_obj, key:_i)),
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
    toJSNode: ({toValue,toReturn}) ->
      if toValue or toReturn
        # @obj @cases @default
        lines = []
        # <Variable> = undefined
        lines.push joe.Assign target:(target=joe.Undetermined('temp')), value:joe.Undefined()
        # switch(@obj) { case(case.matches) { <Variable> = case.block } for case in @cases }
        for _case in @cases
          _case.block = joe.Assign(target:target, value:_case.block).toJSNode(toValue:yes)
        lines.push this
        # <Variable>
        lines.push target.toJSNode({toReturn})
        return joe.Block lines
      else
        return this

  TO_JS_OPS = {'is':'===', '==':'==='}
  joe.Operation::extend
    toJavascript: -> "(#{ if @left?  then js(@left)+' '  else ''
                      }#{ TO_JS_OPS[@op] ? @op
                      }#{ if @right? then ' '+js(@right) else '' })"

  joe.Statement::extend
    toJavascript: -> "#{@type} #{if @expr? then js(@expr) else ''}"

  joe.Assign::extend
    toJSNode: ({toValue,toReturn}={}) ->
      if @target instanceof joe.AssignObj
        lines = []
        if isVariable @value
          valueVar = @value
        else
          valueVar = joe.Undetermined('temp')
          lines.push joe.Assign target:valueVar, value:@value
          @value = valueVar
        @target.destructLines valueVar, lines
        lines.push valueVar.toJSNode({toReturn}) if toValue or toReturn
        return joe.Block(lines)
      else
        return @childrenToJSNode()
    toJavascript: ->
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
          nodes.push part
        else
          nodes.push new String part
      return nodes
      
    toJSNode: ->
      node = undefined
      # construct a '+' operation with the @parts.
      for part in @getParts() when part
        if node is undefined
          node = part
          continue
        else
          node = joe.Operation left:node, op:'+', right:part
      return node or ''
        
    toJavascript: ->
      assert.ok typeof @parts is 'string', "Str.toJavascript can only handle a string part."
      return '"' + escape(@parts) + '"'

  joe.Func::extend
    toJSNode: ->
      ## TODO bind to this for '=>' @type binding
      ## destructuring parameters
      if @params?
        destructs = []
        for {target:param}, i in @params.items
          if not isVariable param
            arg = joe.Undetermined('arg')
            @params.items[i] = joe.AssignItem target:arg
            param.destructLines arg, destructs
        @block.lines[...0] = destructs
      ## make last line return
      @block = @block?.toJSNode(toValue:yes, toReturn:yes)
      return this
    toJavascript: ->
      "function#{ if @params? then '('+@params.toString(no)+')' else '()'} {#{if @block? then js @block else ''}}"

  joe.NativeExpression::extend
    toJavascript: -> @exprStr

  joe.Null::extend
    toJavascript: -> 'null'

  joe.Undefined::extend
    toJavascript: -> 'undefined'

  joe.Invocation::extend
    toJavascript: -> "#{js @func}(#{@params.map (p)->js(p.value)})"

  joe.Index::extend
    toJavascript: ->
      close = if @type is '[' then ']' else ''
      "#{js @obj}#{@type}#{js @key}#{close}"

  joe.Obj::extend
    toJavascript: ->
      "{#{("\"#{escape key}\": #{js value}" for {key, value} in @items).join ', '}}"

  joe.Arr::extend
    toJavascript: ->
      # TODO need to handle splats...
      "[#{(js value for {key, value} in @items).join ', '}]"

  clazz.extend Boolean,
    toJSNode: -> @

  clazz.extend String,
    toJSNode: -> @
    toJavascript: -> '"' + escape(@) + '"'

  clazz.extend Number,
    toJSNode: -> @

@translate = translate = (node) ->
  # console.log node.serialize() # print before transformations...
  # install plugin
  install()
  node = node.toJSNode().installScope().determine()
  node.validate()
  return node.toJavascript()
