{clazz} = require 'cardamom'

@RScope = RScope = clazz 'RScope', ->
  init: ({@parent, @node, @data}) ->
    if not @node?.scope?
     throw new Error "Node #{@node} is missing lexical scope"
    @data ||= {}
  spawn: (node) -> new RScope parent:this, node:node
  set: (name, value) ->
    #console.log "set #{name} = #{value}, @node: #{@node} @node.scope.declares #{name} is #{@node.scope.declares name}, @parent: #{@parent}"
    if @node.scope.declares name
      @data[name] = value
      return yes
    else
      return @parent?.set(name, value)
  get: (name) ->
    if @data.hasOwnProperty(name)
      #console.log "get #{name}: #{@data[name]}"
      return @data[name]
    else return @parent?.get(name)

# TODO provisional
@RObject = RObject = clazz 'RObject', ->
  init: (items) ->
    @data = {}
    @prototype = undefined
