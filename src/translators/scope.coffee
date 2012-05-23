{clazz}   = require 'cardamom'
{inspect} = require 'util'
assert    = require 'assert'
_         = require 'underscore'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require 'joeson/lib/colors'

joe = require('joeson/src/joescript').NODES
{extend, isWord, isVariable, toString} = require('joeson/src/joescript').HELPERS

# A heirarchical lexical scope structure.
@LScope = LScope = clazz 'LScope', ->
  init: (@parent) ->
    @variables  = [] #
    @children   = [] # child LScopes
    @parent.children.push this if @parent?
  declares: (name) ->
    name = toString name unless isVariable name
    return name in @variables
  isDeclared: (name) ->
    name = toString name unless isVariable name
    return true if name in @variables
    return true if @parent?.isDeclared(name)
    return false
  willDeclare: (name) ->
    name = toString name unless isVariable name
    return true if name in @variables
    return true if _.any @children, (child)->child.willDeclare(name)
    return false
  ensureVariable: (name) ->
    name = toString name unless isVariable name
    @variables.push name unless @isDeclared name
  declareVariable: (name) ->
    name = toString name unless isVariable name
    @variables.push name unless name in @variables

@install = ->
  return if joe.Node::installScope? # already defined.

  init = (node, options) ->
    # Dependency validation
    if options.create or not options.parent?
      node.scope = new LScope options.parent?.scope
    else
      node.scope ?= options.parent.scope

  joe.Node::extend
    installScope: (options={}) ->
      init @, options
      @withChildren (child, parent) ->
        child.installScope?(create:no, parent:parent)

  joe.Try::extend
    installScope: (options={}) ->
      init @, options
      @catchBlock.installScope(create:yes, parent:this) if @catchVar? and @catchBlock?
      @catchBlock.scope.declareVariable(@catchVar) if @catchVar?
      @withChildren (child, parent, attr) ->
        child.installScope?(create:no, parent:parent) unless attr is 'catchBlock'

  joe.Func::extend
    installScope: (options={}) ->
      init @, options
      @block.installScope(create:yes, parent:this) if @block?
      @block.scope.declareVariable(name) for name in @params?.targetNames||[]
      @withChildren (child, parent, attr) ->
        child.installScope?(create:no, parent:parent) unless attr is 'block'
