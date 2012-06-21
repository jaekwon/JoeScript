{ clazz,
  colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}
  collections:{Set}} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'
_         = require 'underscore'

indent = (c) -> Array(c+1).join('  ')

# A base node class, used for both Joescript code nodes, and Joeson AST nodes.
@Node = Node = clazz 'Node', ->
  
  # Iterate cb function over all child keys
  # cb:       (child, parent, key, descriptor, key2?) -> ...
  # options:
  #   skipUndefined:  (default yes) Skip over undefined or null children
  withChildren: (cb, options) ->
    skipUndefined = options?.skipUndefined ? yes
    for key, desc of @children||{}
      value = this[key]
      # value is undefined
      if not value? and not desc.required
        continue
      # value is an array of stuff (desc.type[0])
      else if desc.type instanceof Array
        assert.ok value instanceof Array, "Expected ( #{this} (#{this.constructor.name}) ).#{key} to be an Array but got #{value} (#{value?.constructor.name})"
        for item, i in value when item?
          cb(item, this, key, desc.type[0], i)
      # value is an object of value := desc.type.value
      else if desc.type instanceof Object and desc.type.value?
        for _key, _value of value when _value?
          cb(_value, this, key, desc.type.value, _key)
      # all other cases
      else if value? or not skipUndefined
        cb(value, this, key, desc)
    return

  # Depth first walk of entire tree.
  # parent, key, desc, key2: One-time use values for the root node.
  walk: ({pre, post}, parent=undefined, key=undefined, desc=undefined, key2=undefined) ->
    # pre, post: (parent, childnode) -> where childnode in parent.children.
    pre @, parent, key, desc, key2 if pre?
    @withChildren (child, parent, key, desc, key2) ->
      if child not instanceof Node
        throw Error "Unexpected object encountered walking children: #{child} (#{child?.constructor.name})"
      child.walk {pre:pre, post:post}, parent, key, desc, key2
    post @, parent, key, desc, key2 if post?

  # Validate types recursively for all children
  # TODO write some tests that test validation failure.
  validate: ->
    @withChildren (child, parent, key, desc) ->
      error = validateType child, desc
      throw new Error "Error in validation (key='#{key}'): #{error}" if error?
      child.validate() if child instanceof Node
    , skipUndefined:no

  serialize: (_indent=0) ->
    valueStr = this.toString()
    if @ownScope?.variables?.length > 0
      valueStr += yellow (@ownScope.variables.join ' ')
    str = "#{green @constructor.name} #{valueStr}\n"
    @withChildren (child, parent, key, desc, key2) ->
      str += "#{indent _indent+1}#{red '@'+key}#{if key2? then red '['+key2+']' else ''}: " ##{blue inspect desc}\n"
      if child.serialize?
        str += "#{child.serialize(_indent+1)}\n"
      else
        str += "#{''+child} #{"("+child.constructor.name+")"}\n"
    return str.trimRight()

# Returns an error message if validation fails.
validateType = (obj, descriptor) ->
  if not obj?
    return if not descriptor.required
    return "missing value"

  # handle array types
  if descriptor.type instanceof Array
    assert.ok descriptor.type.length is 1, "Dunno how to handle cases where the type is an Array of length != 1"
    type = descriptor.type[0]
    if not obj instanceof Array
      return "Expected #{obj} to be an Array of #{inspect type} but got #{obj?.constructor.name}"
    for item in obj
      error = validateType item, type
      return error if error?
    return # ok

  # handle a set of types
  else if descriptor.type instanceof Set
    for type in descriptor.type.elements
      error = validateType obj, type
      return if not error?
    return "Expected one of #{(inspect type for type in descriptor.type.elements).join(', ')} but got #{obj.constructor.name}"

  # otherwise
  if descriptor.type instanceof Function
    return if obj instanceof descriptor.type # ok
    return "Expected type of #{descriptor.type.name} but got #{obj.constructor.name}"
  else if typeof descriptor.type is 'string'
    return if typeof obj is descriptor.type # ok
    return "Expected native type of #{descriptor.type} but got #{typeof obj}"
  else if descriptor.type?
    assert.ok no, "Should not happen. Dunno how to handle descriptor type #{inspect descriptor.type}"
  # else nothing to do

