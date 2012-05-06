{clazz} = require 'cardamom'

@RScope = RScope = clazz 'RScope', ->
  init: ({@parent, @node, @data}) ->
    if not @node?.scope?
     throw new Error "Node #{@node} is missing lexical scope"
    @data ||= {}
  spawn: (node) -> new RScope parent:this, node:node
  set: (name, value) ->
    if @node.scope.declares name
      @data[name] = value
      return yes
    else
      return @parent?.set(name, value)
  get: (name) ->
    if @node.scope.declares name
      return @data[name]
    else if @parent?
      return @parent.get(name)
    else throw new ReferenceError "JOE: #{name} is not defined"

# TODO provisional
@RObject = RObject = clazz 'RObject', ->
  init: (items) ->
    @data = {}
    @prototype = undefined
