require 'sugar'
{
  clazz,
  colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}
  collections:{Set}
} = require('cardamom')
{inspect} = require 'util'
assert    = require 'assert'

indent = (c) -> Array(c+1).join('  ')

@setOn = (ptr, value) ->
  {parent, key, index} = ptr
  if index?
    ptr.child = parent[key][index] = value
  else
    ptr.child = parent[key] = value
  ptr

validateDescriptor = (nodeClazz, desc) ->
  if Object::hasOwnProperty(desc, 'type')
    assert.ok desc.type?, "descriptor.type was undefined for #{nodeClazz}"
    if desc.type instanceof Array
      validateDescriptor(nodeClazz, desc.type[0])

# There are many types of nodes, so just create a new clazz for each type (grammar, code, runtime etc)
@createNodeClazz = (clazzName) ->

  # A base node class, used for both Joescript code nodes, and Joeson AST nodes.
  Node = clazz clazzName, ->

    @defineChildren = (descriptors) ->
      validateDescriptor(value) for key, value of descriptors
      orig = @prototype.children
      if orig
        @prototype.children = Object.merge Object.clone(orig), descriptors
      else
        @prototype.children = descriptors
    
    # Iterate cb function over all child keys
    # cb:       (child, parent, descriptor, key, index?) -> ...
    # options:
    #   skipUndefined:  (default yes) Skip over undefined or null children
    withChildren: (cb, options) ->
      skipUndefined = options?.skipUndefined ? yes
      return if not @children
      for key, desc of @children when desc?
        value = this[key]
        # value is undefined
        if not value? and not desc.required
          continue
        # value is an array of stuff (desc.type[0])
        else if desc.type instanceof Array
          assert.ok value instanceof Array, "Expected ( #{this} (#{this.constructor.name}) ).#{key} to be an Array but got #{value} (#{value?.constructor.name})"
          for item, i in value when item?
            cb({child:item, parent:this, desc:desc.type[0], key:key, index:i})
        # value is an object of value := desc.type.value
        else if desc.type instanceof Object and desc.type.value?
          for _key, _value of value when _value?
            cb({child:_value, parent:this, desc:desc.type.value, key:key, index:_key})
        else
          # all other cases
          if value? or not skipUndefined
            cb({child:value, parent:this, desc, key})
      return

    # Depth first walk of entire tree.
    # pre, post: Hooks.
    #            ({child, parent, desc, key, index?}) -> for each child as described in @::children.
    # To replace the child with some other node you have two options.
    # 1. Do it in the `post` hook. This is the last method, thus tail recursive, thus it just works.
    # 2. Return the new node in a `$pre` hook, instead of a `pre` hook.
    walk: ({pre, post}, ptr=undefined) ->
      ptr ?= {child:@}
      stop = pre ptr if pre?
      return ptr.child if stop is '__stop__'
      @withChildren (ptr) ->
        ptr.child.walk {pre:pre, post:post}, ptr if ptr.child instanceof Node
      post ptr if post?

    # Validate types recursively for all children
    # TODO write some tests that test validation failure.
    validate: ->
      root = @
      @withChildren ({child, parent, desc, key, index}) ->
        error = validateType child, desc
        throw new Error "Error in validation {parent:#{parent.constructor.name}, key:#{key}, start:#{inspect parent._origin?.start}): #{error}\n#{root.serialize()}" if error?
        child.validate() if child instanceof Node
      , skipUndefined:no
      @

    serialize: (filter, _indent=0) ->
      if filter is undefined # sensible default filter to avoid infinite recursion
        cache1 = {}
        cache2 = []
        filter = (node) ->
          if node.id?
            seen = cache1[node.id]
            cache1[node.id] = yes
          else
            seen = node in cache2
            cache2.push seen
          return not seen
      return '-- filtered --' if filter? and not filter @
      throw new Error "_indent (#{_indent}) too high, stack overflow?" if _indent > 1024
      valueStr = this.toString().replace('\n','\\n')[..10]
      if @ownScope?.variables?.length > 0 # TODO move out or delete or something.
        valueStr += ' '+yellow (@ownScope.variables.join ' ')
      if @marked?
        valueStr += cyan ' marked'
      str = "#{green @constructor.name} #{valueStr}\n"
      @withChildren ({child, parent, desc, key, index}) ->
        str += "#{indent _indent+1}#{red '@'+key}#{if index? then red '['+index+']' else ''}: " ##{blue inspect desc}\n"
        if child.serialize?
          str += "#{child.serialize(filter, _indent+1)}\n"
        else #if child.toString?
          str += "#{''+child} (#{child.constructor.name})\n"
        #else
        #  str += "#{inspect child} (#{child?.constructor?.name})\n"
      return str.trimRight()

  # Returns an error message if validation fails.
  validateType = (obj, descriptor) ->
    if not obj?
      return if not descriptor.required
      return "missing value"
    assert.ok typeof descriptor is 'object', "Invalid desciptor #{descriptor} (#{descriptor?.constructor?.name})"

    # handle array types
    if descriptor.type instanceof Array
      assert.ok descriptor.type.length is 1, "Dunno how to handle cases where the type is an Array of length != 1"
      type = descriptor.type[0]
      if not obj instanceof Array
        return "Expected #{obj} to be an Array of #{inspect type} but got #{obj?.constructor.name}"
      for item in obj
        error = validateType item, {type}
        return error if error?
      return # ok

    # handle a set of types
    else if descriptor.type instanceof Set
      for type in descriptor.type.elements
        error = validateType obj, {type}
        return if not error?
      return "Expected one of #{(type.name ? type for type in descriptor.type.elements).join(', ')} but got #{obj.constructor.name}"

    # otherwise
    if descriptor.type instanceof Function
      return if obj instanceof descriptor.type # ok
      return "Expected type of #{descriptor.type.name} but got #{obj.constructor.name}"
    else if typeof descriptor.type is 'string'
      if descriptor.type in ['number', 'boolean', 'function', 'string']
        return if typeof obj is descriptor.type # ok
        return "Expected native type of #{descriptor.type} but got #{typeof obj}"
      else
        return if obj?.constructor?.name is descriptor.type
        return "Expected constructor name of #{descriptor.type} but got #{obj?.constructor?.name}"
    else if descriptor.type?
      assert.ok no, "Should not happen. Dunno how to handle descriptor type #{inspect descriptor.type}"
    # else nothing to do

  return Node
