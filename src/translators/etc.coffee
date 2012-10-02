{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'

{
  NODES:joe
} = require 'sembly/src/joescript'

{randid}  = require 'sembly/lib/helpers'

joe.Node::extend
  # Walks the tree and finds Funcs,
  # and adds them to @_functions, {<start pos>:<Func instance>}
  collectFunctions: ->
    @_functions = {}
    @walk pre:({child:node, parent, key, desc, index}) =>
      if node instanceof joe.Func
        assert.ok node._origin?, "While collection functions, found Func with no _origin: #{node}"
        @_functions[node._origin.start.pos] = node
    @
