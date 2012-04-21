assert = require 'assert'
_ = require 'underscore'
js = require('../joescript_grammar').NODES

prepareAST = (node) ->

  # create a global scope for node if it doesn't already exist.
  node.scope ||= if node instanceof js.Block then node else js.Block()

  # connect all nodes to their parents, set scope, and prepare.
  node.walk
    pre: (parent, node) ->
      assert.ok node?
      node.parent ||= parent
      if node instanceof js.Block and node.parent instanceof js.Func
        node.scope ||= node
      else
        node.scope ||= parent.scope
    post:(parent, node) ->
      node.prepare()

  # collect all variables to the scope.
  node.walk
    pre: (parent, node) ->
      if node instanceof js.Assign
        if node.target instanceof js.Word or typeof node.target is 'string'
          varname = ''+node.target
          node.scope.addVar varname

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
          @stack.unshift translateNode nextItem
          continue
        else if nextItem instanceof Object and nextItem.type?
          return nextItem
        else
          throw Error "Unexpected item type: #{nextItem} (#{typeof nextItem})"
  return iterator

# Helper for transgenerator
# Translate a node into an array of strings.
# Returned array may be nested.
translateNode = (node) ->
  switch node.constructor
    when js.Block
      formattedLines = []
      if node is node.scope and node.vars?
        for varname in node.vars
          formattedLines.push js.Assign target:varname, type:'=', value:js.Undefined
          formattedLines.push ENDLINE
          formattedLines.push NEWLINE
      for line, i in node.lines
        formattedLines.push line
        formattedLines.push ENDLINE
        formattedLines.push NEWLINE if i isnt node.lines.length-1
      return formattedLines
    when js.Index
      return ''+node
    when js.Assign
      return [translateNode(node.target), " #{node.type} ", translateNode(node.value)]
    else
      return ["/* Unknown thing #{node.constructor.name} */"]

@translate = (node) ->
  prepareAST node
  generator = translator node
  indent = 0
  result = ''
  while item = generator.next()
    return if item is null
    switch item.type
      when 'INDENT' then indent += 1
      when 'OUTDENT' then indent -= 1
      when 'NEWLINE' then result += '\n'+Array(indent+1).join('  ')
      when 'ENDLINE' then result += ';'
      else
        result += item
  result
