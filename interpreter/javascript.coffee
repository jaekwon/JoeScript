assert = require 'assert'
_ = require 'underscore'
js = require('../joescript_grammar').NODES
{inspect} = require 'util'

isTrue = (node) ->
  switch typeof node
    when 'number', 'string', 'boolean' then Boolean(node)
    when 'object'
      switch node
        when js.Undefined.undefined, js.Null.null then false
        else true
    when 'function' then true
    else throw new Error "Unexpected node for isTrue: #{node} (#{node.constructor.name})"

# Interpret the given node
@interpretOnce = _i_ = interpretOnce = (node, options) ->
  {context} = options

  valueOf = (node) -> _i_ node, options

  switch node.constructor

    when js.Block
      for line, i in node.lines
        res = valueOf line
        if i is node.lines.length-1
          return res
      undefined

    when js.Index
      'TODO:Index'

    when js.Assign
      value = valueOf if node.op then js.Operation left:valueOf(node.target), op:node.op, right:node.value else node.value
      if node.target instanceof js.Word
        context.scope[node.target] = value
      else
        throw new Error "Unexpected node target #{node.target}"
      return value

    when js.If
      ifRes = valueOf node.cond
      if isTrue ifRes
        valueOf node.block
      else if node.elseBlock?
        valueOf node.elseBlock

    when js.While, js.Loop
      'TODO:While,Loop'

    when js.Operation
      result = switch node.op
        when '+' then valueOf(node.left) + valueOf(node.right)
        when '-' then valueOf(node.left) - valueOf(node.right)
        when '*' then valueOf(node.left) * valueOf(node.right)
        when '/' then valueOf(node.left) / valueOf(node.right)
        else throw new Error "Unexpected operation #{node.op}"
      result = not result if node.not
      return result

    when js.Invocation
      'TODO:Invocation'

    when js.Statement
      'TODO:Statement'

    when js.Obj
      'TODO:Obj'

    when js.Arr
      'TODO:Arr'
      
    when js.Func
      'TODO:Func'

    when String, Number, Boolean, js.Undefined, js.Null
      return node

    when js.Word
      return context.scope[node]

    when js.Str
      return (valueOf(part) for part in node.parts).join ''

    else
      throw new Error "Dunno how to interpret #{node} (#{node.constructor?.name})"

@interpret = (node) ->
  node.prepare() if not node.prepared
  interpretOnce node, context:{scope:{}}
