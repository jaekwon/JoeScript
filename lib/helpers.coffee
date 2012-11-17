# This file contains the common helper functions that we'd like to share among
# the **Lexer**, **Rewriter**, and the **Nodes**. Merge objects, flatten
# arrays, count characters, that sort of thing.

# Peek at the beginning of a given string to see if it matches a sequence.
@starts = (string, literal, start) ->
  literal is string.substr start, literal.length

# Peek at the end of a given string to see if it matches a sequence.
@ends = (string, literal, back) ->
  len = literal.length
  literal is string.substr string.length - len - (back or 0), len

# Trim out all falsy values from an array.
@compact = (array) ->
  item for item in array when item

# Count the number of occurrences of a string in a string.
@count = (string, substr) ->
  num = pos = 0
  return 1/0 unless substr.length
  num++ while pos = 1 + string.indexOf substr, pos
  num

# Merge objects, returning a fresh copy with attributes from both sides.
# Used every time `Base#compile` is called, to allow properties in the
# options hash to propagate down the tree without polluting other branches.
@merge = (options, overrides) ->
  extend (extend {}, options), overrides

# Extend a source object with the properties of another object (shallow copy).
@extend = extend = (object, properties) ->
  for key, val of properties
    object[key] = val
  object

# Return a flattened version of an array.
# Handy for getting a list of `children` from the nodes.
@flatten = flatten = (array) ->
  flattened = []
  for element in array
    if element instanceof Array
      flattened = flattened.concat flatten element
    else
      flattened.push element
  flattened

# Delete a key from an object, returning the value. Useful when a node is
# looking for a particular method in an options hash.
@del = (obj, key) ->
  val =  obj[key]
  delete obj[key]
  val

# Gets the last item of an array(-like) object.
@last = (array, back) -> array[array.length - (back or 0) - 1]

@toAscii = toAscii = (str) ->
  return str.replace /[\u001b\u0080-\uffff]/g, (ch) ->
    code = ch.charCodeAt(0).toString(16)
    code = "0" + code while code.length < 4
    "\\u"+code

@escape = (str, asciiOnly=yes) ->
  str = str.replace /[\\\b\f\n\r\t\x22\u2028\u2029\0]/g, (s) ->
    switch s
      when "\\" then "\\\\"
      when "\b" then "\\b"
      when "\f" then "\\f"
      when "\n" then "\\n"
      when "\r" then "\\r"
      when "\u2028" then "\\u2028"
      when "\u2029" then "\\u2029"
      when '"'  then "\\\""
      when "\0" then "\\0"
      else s
  str = toAscii str if asciiOnly
  return str

# Escape HTML special characters. Result must be valid HTML text
@htmlEscape = (txt) ->
  String(txt).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

@pad = ({left,right}, str) ->
  str = ''+str
  if right? and right > str.length
    return Array(right-str.length+1).join(' ')+str
  else if left > str.length
    return str+Array(left-str.length+1).join(' ')
  return str

@randid = (len=12) ->
  possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  return (possible.charAt(Math.floor(Math.random() * possible.length)) for i in [0...len]).join ''

@weave = (items, join, options) ->
  result = []
  itemsLength = items.length
  for item, i in items
    if options?.flattenItems
      result[result.length...] = item
    else
      result.push item
    if i < itemsLength-1
      result.push join
  return result

# why not
unless Array::weave?
  Object.defineProperty (Array.prototype), 'weave', configurable:no, enumerable:no, value:(join, options) ->
    result = []
    length = @length
    for item, i in this
      if options?.flattenItems
        result[result.length...] = item
      else
        result.push item
      if i < length-1
        result.push join
    return result
