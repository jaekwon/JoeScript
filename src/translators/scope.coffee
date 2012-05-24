{clazz}   = require 'cardamom'
{inspect} = require 'util'
assert    = require 'assert'
_         = require 'underscore'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require 'joeson/lib/colors'

joe = require('joeson/src/joescript').NODES
{extend, isWord, isVariable} = require('joeson/src/joescript').HELPERS

# A heirarchical lexical scope structure.
@LScope = LScope = clazz 'LScope', ->
  init: (@parent) ->
    @variables  = [] #
    @parameters = []
    @children   = [] # child LScopes
    @parent.children.push this if @parent?
  declares: (name) ->
    name = ''+name unless name instanceof joe.Undetermined
    return name in @variables
  isDeclared: (name) ->
    name = ''+name unless name instanceof joe.Undetermined
    return true if name in @variables
    return true if @parent?.isDeclared(name)
    return false
  willDeclare: (name) ->
    name = ''+name unless name instanceof joe.Undetermined
    return true if name in @variables
    return true if _.any @children, (child)->child.willDeclare(name)
    return false
  ensureVariable: (name) ->
    name = ''+name unless name instanceof joe.Undetermined
    @variables.push name unless @isDeclared name
  declareVariable: (name, isParameter=no) ->
    name = ''+name unless name instanceof joe.Undetermined
    @variables.push name unless name in @variables
    @parameters.push name unless name in @parameters if isParameter
  nonparameterVariables$: get: ->
    _.difference @variables, @parameters

@install = ->
  return if joe.Node::installScope? # already defined.

  init = (node, options) ->
    # Dependency validation
    if options.create or not options.parent?
      node.scope = node.ownScope = new LScope options.parent?.scope
    else
      node.scope ?= options.parent.scope

  joe.Node::extend
    installScope: (options={}) ->
      init @, options
      @withChildren (child, parent) ->
        child.installScope?(create:no, parent:parent)
    collectVariables: ->
      @withChildren (child, parent) ->
        child.collectVariables?()

  joe.Try::extend
    installScope: (options={}) ->
      init @, options
      @catchBlock.installScope(create:yes, parent:this) if @catchVar? and @catchBlock?
      @withChildren (child, parent, attr) ->
        child.installScope?(create:no, parent:parent) unless attr is 'catchBlock'
    collectVariables: ->
      @catchBlock.scope.declareVariable(@catchVar) if @catchVar?
      @withChildren (child, parent, attr) ->
        child.collectVariables?() unless attr is 'catchBlock'

  joe.Func::extend
    installScope: (options={}) ->
      init @, options
      @block.installScope(create:yes, parent:this) if @block?
      @withChildren (child, parent, attr) ->
        child.installScope?(create:no, parent:parent) unless attr is 'block'
    collectVariables: ->
      @block.scope.declareVariable(name, yes) for name in @params?.targetNames||[]
      @withChildren (child, parent, attr) ->
        child.collectVariables?() unless attr is 'block'

  joe.Assign::extend
    collectVariables: ->
      @scope.ensureVariable(@target) if isVariable @target
      @withChildren (child, parent, attr) ->
        child.collectVariables?()
