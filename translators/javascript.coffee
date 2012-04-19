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
      if node instanceof js.Assign and node.target instanceof js.

translateNode = (node) ->
  null

@translate = (node) ->
  prepareAST node
  translateNode node
