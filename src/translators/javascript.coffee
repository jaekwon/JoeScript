assert = require 'assert'
_ = require 'underscore'
{inspect} = require 'util'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require 'joeson/lib/colors'

joe = require('joeson/src/joescript').NODES
{extend, isWord, isVariable} = require('joeson/src/joescript').HELPERS
{compact, flatten} = require('joeson/lib/helpers')

jsValue = (obj) ->
  return obj.toJSValue() if obj instanceof joe.Node
  return obj

jsNode = (obj, options) ->
  return obj.toJSNode(options) if obj instanceof joe.Node
  return obj

js = (node) -> if node instanceof joe.Node then node.toJavascript() else node

@install = install = ->
  return if joe.Node::toJSNode? # already defined.
  require('joeson/src/translators/scope').install() # dependency

  joe.Node::extend
    toJSNode: ({toValue}={}) ->
      return @toJSValue().toJSNode() if toValue
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

  joe.Word::extend
    toJavascript: ->
      ''+this

  joe.Block::extend
    toJSValue: ->
      @isValue = yes
      if not @lines? or @lines.length is 0
        return joe.Undefined()
      else if @lines.length is 1
        return jsValue @lines[0]
      else
        @lines[@lines.length-1] = jsValue @lines[@lines.length-1]
        return this
    toJavascript: ->
      if @ownScope? and (toDeclare=@ownScope.nonparameterVariables)?.length > 0
        lines = ["var #{toDeclare.join(', ')}", @lines...]
      else
        lines = @lines
      if @isValue
        "(#{(js(line) for line in lines).join '; '})"
      else
        (js(line)+';' for line in lines).join '\n'

  joe.If::extend
    toJSValue: ->
      @isValue = yes
      @block = jsValue @block
      @elseBlock = jsValue @elseBlock
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
    toJSValue: ->
      target = joe.Variable()
      @block = joe.Assign target:target, value:@block
      @catchBlock = joe.Assign target:target, value:@catchBlock
      return joe.Block [this, target]
    toJavascript: -> "try {#{js @block}}#{
      (@catchVar? or @catchBlock?) and " catch (#{js(@catchVar) or ''}) {#{js @catchBlock}}" or ''}#{
      @finally and "finally {#{js @finally}}" or ''}"

  joe.Loop::extend
    toJSValue: ->
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

  joe.For::extend
    toJSNode: ({toValue}={}) ->
      return @toJSValue().toJSNode() if toValue

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

  joe.Switch::extend
    toJSValue: ->
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

  joe.Operation::extend
    toJavascript: -> "(#{ if @left?  then js(@left)+' '  else ''
                      }#{ @op
                      }#{ if @right? then ' '+js(@right) else '' })"

  joe.Statement::extend
    toJavascript: -> "#{@type}(#{if @expr? then js(@expr)? else ''});"


  joe.Assign::extend
    toJavascript: -> "#{js @target} #{@op or ''}= #{js @value}"

  joe.Func::extend
    toJSNode: ->
      ## mutate for '=>' @type binding
      ## mutate parameters
      return this
    toJavascript: ->
      "function #{ if @params? then '('+@params.toString(no)+')' else '()'} {#{js @block}}"

@translate = translate = (node) ->
  # install plugin
  install()
  # validate node. TODO
  node.validate()
  # prepare nodes
  node.installScope()
  node.collectVariables()
  node = jsNode node
  # return translated string
  return node.toJavascript()
