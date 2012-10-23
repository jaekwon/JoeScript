#
# CONTRACT:
#   Calling installScope on a node with scope already installed
#   should be a safe operation that re-installs the scope.
#   After node translations like node.toJSNode(), you need to re-install.
#

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'

{
  NODES:joe
  HELPERS:{isKey,isVariable}
} = require 'joescript/src/joescript'

{randid}  = require 'joescript/lib/helpers'

# A heirarchical lexical scope structure.
@LScope = LScope = clazz 'LScope', ->
  init: (parent) ->
    # this is to make scopes and nodes non-circular.
    Object.defineProperty this, 'parent', value:parent, enumerable:no
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
    return true if @children.some (child)->child.willDeclare(name)
    return false
  ensureVariable: (name) ->
    name = ''+name unless name instanceof joe.Undetermined
    @variables.push name unless @isDeclared name
  declareVariable: (name, isParameter=no) ->
    name = ''+name unless name instanceof joe.Undetermined
    @variables.push name unless name in @variables
    @parameters.push name unless name in @parameters if isParameter
  nonparameterVariables$: get: ->
    @variables.subtract @parameters

_init = (node, options) ->
  # Dependency validation
  if options.create or not options.parent?
    node.scope = node.ownScope = new LScope options.parent?.scope
  else
    node.scope = options.parent.scope

joe.Node::extend
  installScope: (options={}) ->
    _init @, options
    @withChildren ({child, parent}) ->
      child.installScope?(create:no, parent:parent)
    return this
  determine: ->
    that = this
    @withChildren ({child, parent, desc, key, index}) ->
      child.determine() if child instanceof joe.Node
    @

joe.Try::extend
  installScope: (options={}) ->
    _init @, options
    if @catchVar? and @catchBlock?
      @catchBlock.installScope(create:yes, parent:this)
      @catchBlock.scope.declareVariable(@catchVar)
    @withChildren ({child, parent, desc, key, index}) ->
      child.installScope?(create:no, parent:parent) unless key is 'catchBlock'
    return this

joe.Func::extend
  installScope: (options={}) ->
    _init @, options
    @block.installScope(create:yes, parent:this) if @block?
    @block.scope.declareVariable(name, yes) for name in @params?.targetNames||[]
    @withChildren ({child, parent, desc, key, index}) ->
      child.installScope?(create:no, parent:parent) unless key is 'block'
    return this

joe.Assign::extend
  installScope: (options={}) ->
    _init @, options
    @scope.ensureVariable(@target) if isVariable(@target) and not @op?
    @withChildren ({child, parent, desc, key, index}) ->
      child.installScope?(create:no, parent:parent)
    return this

joe.Undetermined::extend
  determine: ->
    return if @key? # already determined.
    assert.ok @scope?, "Scope must be available to determine an Undetermined"
    loop
      key = @prefix+'_$'+randid(4)+'$_'
      if not @scope.isDeclared(key) and not @scope.willDeclare(key)
        return @key=key

joe.JSForK::extend
  installScope: (options={}) ->
    _init @, options
    @withChildren ({child, parent}) ->
      child.installScope?(create:no, parent:parent)
    @scope.ensureVariable(@key)
    return @
