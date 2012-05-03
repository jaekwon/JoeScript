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
@interpretOnce = IO = interpretOnce = (node, options={context}={}) ->

  switch node.constructor

    when js.Block
      for line, i in node.lines
        res = IO line, options
        if i is node.lines.length-1
          return res
      undefined

    when js.Index
      'TODO:Index'

    when js.Assign
      target = node.target
      'TODO:Assign'

    when js.If
      ifRes = IO node.cond, options
      if isTrue ifRes
        IO node.block, options
      else if node.elseBlock?
        IO node.elseBlock, options

    when js.While, js.Loop
      'TODO:While,Loop'

    when js.Operation
      'TODO:Operation'

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
      throw new Error "Code literals are not available as an interpretation value"

    when js.Str
      'TODO:Str'

    else
      throw new Error "Dunno how to interpret #{node} (#{node.constructor?.name})"

@interpret = (node) ->
  node.prepare() if not node.prepared
  interpretOnce node, context:null
