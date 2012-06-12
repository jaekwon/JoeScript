{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'

joe = require('joeson/src/joescript').NODES
{extend, isWord, isVariable} = require('joeson/src/joescript').HELPERS
{escape, compact, flatten} = require('joeson/lib/helpers')

jsValue = (obj) ->
  return obj.trigger(type:'toValue') if obj instanceof joe.Node
  return obj

jsNode = (obj, options) ->
  return obj.toJSNode(options) if obj instanceof joe.Node
  return obj

js = (obj) -> if obj.toJavascript? then obj.toJavascript() else obj

trigger = (obj, msg) -> if obj instanceof joe.Node then obj.trigger(msg) else obj

@install = install = ->
  return if joe.Node::toJSNode? # already defined.
  require('joeson/src/translators/scope').install() # dependency

  joe.Node::extend
    toJSNode: ({toValue}={}) ->
      return jsValue(@).toJSNode() if toValue
      @childrenToJSNode()
      return this
    childrenToJSNode: ->
      node = this
      @withChildren (child, parent, attr, desc, index) ->
        if index?
          node[attr][index] = jsNode child, toValue:desc.value
        else
          node[attr] = jsNode child, toValue:desc.value
      null
    toJavascript: ->
      throw new Error "#{@constructor.name}.toJavascript not defined"
    trigger: (msg) -> switch msg.type
      when 'toValue'
        return this
      when 'toStatement'
        if this instanceof joe.Statement
          return this
        else
          return joe.Statement type:'return', expr:this
      else
        return this

  joe.Word::extend
    toJavascript: ->
      ''+this

  joe.Block::extend
    trigger: (msg) -> switch msg.type
      when 'toValue', 'toStatement'
        @isValue = msg.type is 'toValue'
        if not @lines? or @lines.length is 0
          return joe.Undefined()
        else if @lines.length is 1
          return trigger @lines[0], msg
        else
          @lines[@lines.length-1] = trigger @lines[@lines.length-1], msg
          return this
      else
        return this
    toJavascript: ->
      if @ownScope? and (toDeclare=@ownScope.nonparameterVariables)?.length > 0
        lines = [joe.NativeExpression("var #{toDeclare.join(', ')}"), @lines...]
      else
        lines = @lines
      if @isValue
        "(#{(js(line) for line in lines).join '; '})"
      else
        (js(line) for line in lines).join ';\n'

  joe.If::extend
    trigger: (msg) -> switch msg.type
      when 'toValue', 'toStatement'
        @isValue = msg.type is 'toValue'
        @block = trigger @block, msg
        @elseBlock = trigger @elseBlock, msg
        return this
      else
        return this
    toJavascript: ->
      if @isValue
        "(#{js @cond} ? #{js @block} : #{js @elseBlock})"
      else
        if @elseBlock?
          "if(#{js @cond}){#{js @block}}else{#{js @elseBlock}}"
        else
          "if(#{js @cond}){#{js @block}}"

  joe.Try::extend
    trigger: (msg) -> switch msg.type
      when 'toValue'
        target = joe.Variable()
        @block = joe.Assign target:target, value:@block
        @catchBlock = joe.Assign target:target, value:@catchBlock
        return joe.Block [this, target]
      else
        return this
    toJavascript: -> "try {#{js @block}}#{
      (@catchVar? or @catchBlock?) and " catch(#{js(@catchVar) or ''}) {#{js @catchBlock}}" or ''}#{
      @finally and "finally {#{js @finally}}" or ''}"

  joe.Loop::extend
    trigger: (msg) -> switch msg.type
      when 'toValue'
        lines = []
        # <Variable> = []
        lines.push joe.Assign target:(target=joe.Variable()), value:joe.Arr()
        # @label:
        # while(@cond) {
        #   <Variable>.push(@block)
        # }
        @block = joe.Invocation func:joe.Index(obj:target,attr:'push'), params:[@block]
        lines.push this
        # <Variable>
        lines.push target
        return joe.Block lines
      else
        return this
    toJavascript: -> "while(#{js @cond}) {#{js @block}}"

  joe.For::extend
    toJSNode: ({toValue}={}) ->
      return jsValue(@).toJSNode() if toValue

      switch @type
        when 'in' # Array iteration
          setup = joe.Block [
            if @keys.length > 1
              # for (@keys[1] = _i = 0; ...
              joe.Assign(target:@keys[1], value:
                joe.Assign(target:_i=joe.Variable('_i'), value:0))
            else
              # for (_i = 0; ...
              joe.Assign(target:_i=joe.Variable('_i'), value:0)
            ,
            joe.Assign(target:_len=joe.Variable('_len'), value:joe.Index(obj:@obj, attr:'length')),
          ]
          # _i < _len; ...
          cond = joe.Operation left:_i, op:'<', right:_len
          counter =
            if @keys.length > 1
              # @keys[1] = _i++)
              joe.Assign(target:@keys[1], value:joe.Op(left:_i, op:'++'))
            else
              # _i++)
              joe.Op(left:_i, op:'++')
          block = joe.Block [
            joe.Assign(target:@keys[0], value:joe.Index(obj:@obj, attr:_i)),
            if @cond?
              # if (@cond) { @block }
              joe.If(cond:@cond, block:@block)
            else
              @block
          ]
          node = joe.JSForC label:@label, block:@block, setup:setup, cond:cond, counter:counter
          node.childrenToJSNode()
          return node

        when 'of' # Object iteration
          # for (@keys[0] in @obj)
          key = @keys[0]
          block = joe.Block compact [
            joe.Assign(target:@keys[1], value:joe.Index(obj:@obj, attr:key)) if @keys[1],
            if @cond?
              # if (@cond) { @block }
              joe.If(cond:@cond, block:@block)
            else
              @block
          ]
          node = joe.JSForK label:@label, block:@block, key:key, obj:@obj
          node.childrenToJSNode()
          return node
          
        else throw new Error "Unexpected For type #{@type}"
      # end switch

      @childrenToJSNode()

  joe.Switch::extend
    trigger: (msg) -> switch msg.type
      when 'toValue'
        # @obj @cases @default
        lines = []
        # <Variable> = undefined
        lines.push joe.Assign target:(target=joe.Variable()), value:joe.Undefined()
        # switch(@obj) { case(case.matches) { <Variable> = case.block } for case in @cases }
        for _case in @cases
          _case.block = joe.Assign target:target, value:_case.block
        lines.push this
        # <Variable>
        lines.push target
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
    toJavascript: -> "#{js @target} #{@op or ''}= #{js @value}"

  joe.Str::extend
    nodeParts$: get: ->
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
      for part in @nodeParts
        if node is undefined
          node = part
          continue
        else
          node = joe.Operation left:node, op:'+', right:part
      return node
        
    toJavascript: ->
      assert.ok typeof @parts is 'string', "Str.toJavascript can only handle a string part."
      return '"' + escape(@parts) + '"'

  String::toJavascript = -> '"' + escape(@) + '"'

  joe.Func::extend
    toJSNode: ->
      ## mutate for '=>' @type binding
      ## mutate parameters
      ## make last line return
      @block = trigger @block, type:'toStatement', statement:'return'
      @childrenToJSNode()
      return this
    toJavascript: ->
      "function#{ if @params? then '('+@params.toString(no)+')' else '()'} {#{js @block}}"

  joe.NativeExpression::extend
    toJavascript: -> @exprStr

  joe.Null::extend
    toJavascript: -> 'null'

  joe.Undefined::extend
    toJavascript: -> 'undefined'

  joe.Invocation::extend
    toJavascript: -> "#{js @func}(#{@params.map (p)->js(p)})"

  joe.Index::extend
    toJavascript: ->
      close = if @type is '[' then ']' else ''
      "#{js @obj}#{@type}#{js @attr}#{close}"

  joe.Obj::extend
    toJavascript: ->
      xxx

@translate = translate = (node) ->
  # console.log node.serialize() # print before transformations...
  # install plugin
  install()
  return node.toJSNode().installScope().toJavascript()
