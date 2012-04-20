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
        if node.target instanceof js.Word
          node.scope.addVar node.target
        else if typeof node.target is 'string'
          node.scope.addVar js.Word node.target

# For each type of Joescript node, return a string or array of strings, and each array having the following property(S)
#   indent: yes|no (default: no)      Whether the children should be indented in the final output.
translateNode = (node) ->
  switch node.constructor.name
    when 'Block'
      console.log "Block"
    when 'If'
      console.log "If"
    when 'Array'
      translateNode(child) for child in node
    # else do nothing
  if node.children?
    for child in node.children when child?
      translateNode child
  null

@translate = (node) ->
  prepareAST node
  translateNode node
