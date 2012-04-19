prepareAST = (node) ->
  
  # connect all nodes to their parents
  node.walk pre:(parent, node) -> node.parent = parent

@translate = (node) ->

  prepareAST node
  "foo"
