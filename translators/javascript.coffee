assert = require 'assert'
_ = require 'underscore'
js = require('../joescript_grammar').NODES

INDENT  = type:'INDENT'
OUTDENT = type:'OUTDENT'
NEWLINE = type:'NEWLINE'
ENDLINE = type:'ENDLINE'

# Returns a generator... call .next() on it to get the next item.
# Objects returned by generator are strings or {type} objects
translator = (node) ->
  iterator =
    stack: [node]
    next: ->
      loop
        return null if @stack.length is 0
        nextItem = @stack.shift()
        if typeof nextItem is 'string'
          return nextItem
        else if nextItem instanceof Array
          if nextItem.indent
            @stack.unshift OUTDENT
            @stack[...0] = nextItem
            return INDENT
          else
            @stack[...0] = nextItem
            continue
        else if nextItem instanceof js.Node
          @stack.unshift translateOnce nextItem
          continue
        else if nextItem instanceof Object and nextItem.type?
          return nextItem
        else if nextItem?
          @stack.unshift translateOnce nextItem
          continue
  return iterator

# Helper for transgenerator
# Translate a node into an array of strings.
# Returned array may be nested.
translateOnce = (node) ->
  switch node.constructor
    when js.Block
      formattedLines = []
      if node is node.scope and node.vars?
        for varname in node.vars
          formattedLines.push "var #{varname} = undefined"
          formattedLines.push ENDLINE
          formattedLines.push NEWLINE
      for line, i in node.lines
        formattedLines.push line
        formattedLines.push ENDLINE
        formattedLines.push NEWLINE if i isnt node.lines.length-1
      return formattedLines
    when js.Index
      return "#{node}"
    when js.Assign
      return [translateOnce(node.target), " #{node.type} ", translateOnce(node.value)]
    when js.If
      if node.else?
        return ["if(", node.cond, ") {", INDENT, node.block, OUTDENT, "} else {", INDENT, node.else, OUTDENT, "}"]
      else
        return ["if(", node.cond, ") {", INDENT, node.block, OUTDENT, "}"]
    when js.While, js.Loop
      return ["while(", node.cond, ") {", INDENT, node.block, OUTDENT, "}"]
    when js.Operation
      jsOp = {'==':'===', 'is':'===', 'isnt':'!=='}[node.op] ? node.op
      return [(if node.not then "(!(" else "("), node.left, " #{jsOp} ", node.right, (if node.not then "))" else ")")]
    when js.Invocation
      return [node.func, "(", node.params, ")"]
    when js.Statement
      if node.expr?
        return [node.type, " ", node.expr]
      else
        return node.type
    when js.Func
      # pull out the params
      topNames = if node.params? then for param in node.params
        if param instanceof js.Word or typeof param is 'string'
          param
        else
          node.block.addVar('arg')
      console.log "topnames:", topNames
      return ["function() {", INDENT, node.block, OUTDENT, "}"]
    when String, Boolean, js.Undefined, js.Null
      return ''+node
    when null, undefined
      return ''
    else
      return ["/* Unknown thing #{node.constructor.name} #{node}*/"]

@translate = (node) ->
  generator = translator node
  indent = 0
  result = ''
  while item = generator.next()
    return if item is null
    switch item.type
      when 'INDENT'  then result += '\n'+Array(++indent+1).join('  ')
      when 'OUTDENT' then result += '\n'+Array(--indent+1).join('  ')
      when 'NEWLINE' then result += '\n'+Array(indent+1).join('  ')
      when 'ENDLINE' then result += ';'
      else
        result += item
  result
