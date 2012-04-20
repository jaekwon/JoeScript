assert = require 'assert'
js = require('../joescript_grammar').NODES

prepareAST = (node) ->

  # create a global scope for node if it doesn't already exist.
  node._scope ||= if node instanceof js.Block then node else js.Block()

  # connect all nodes to their parents, set _scope, and prepare.
  node.walk
    pre: (parent, node) ->
      assert.ok node?
      node._parent ||= parent
      if node instanceof js.Block and node.parent instanceof js.Func
        node._scope ||= node
      else
        node._scope ||= parent._scope
    post:(parent, node) ->
      node.prepare()

  # collect all variables to the scope.
  node.walk
    pre: (parent, node) ->
      if node instanceof js.Assign
        if node.target instanceof js.Word or typeof node.target is 'string'
          varname = ''+node.target
          node.scope.addVar varname

# Returns a generator... call .next() on it to get the next item.
# Objects returned by generator are strings or {type} objects where
#   type: 'INDENT' | 'OUTDENT' | 'NEWLINE'
translator = (node) ->
  iterator =
    stack: [node]
    next: ->
      loop
        return null if @stack.length is 0
        nextItem = @stack.pop()
        if typeof nextItem is 'string'
          return nextItem
        else if nextItem instanceof Array
          if nextItem.indent
            @stack.push type:'OUTDENT'
            @stack[@stack.length-1...] = nextItem
            return type:'INDENT'
          else
            @stack[@stack.length-1...] = nextItem
            continue
        else if nextItem instanceof Node
          @stack.push translateNode nextItem
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
      # also yield variable declarations.
      return node.lines
    else
      return "/* Unknown */"

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
      else
        result += item
  result
