{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'

{
  NODES:joe
  HELPERS:{isWord,isVariable}
} = require 'sembly/src/joescript'

{randid}  = require 'sembly/lib/helpers'

@install = ->
  return if joe.Node::collectFunctions? # already defined.

  joe.Node::extend
    # Walks the tree and finds Funcs,
    # and adds them to @_functions, {<start pos>:<Func instance>}
    collectFunctions: ->
      @_functions = {}
      @walk pre:(node, parent, key, desc, key2) =>
        if node instanceof joe.Func
          assert.ok node._origin?, "While collection functions, found Func with no _origin: #{node}"
          @_functions[node._origin.start.pos] = node
      @
