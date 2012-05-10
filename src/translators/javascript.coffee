assert = require 'assert'
_ = require 'underscore'
joe = require('joeson/src/joescript').NODES
{inspect} = require 'util'

INDENT  = type:'__indent__'
OUTDENT = type:'__outdent__'
NEWLINE = type:'__newline__'
ENDLINE = type:'__endline__'

extend = (dest, source) -> dest[dest.length...] = source

addImplicitReturns = (node) ->
  node.walk
    pre: (parent, node) ->
      if node instanceof joe.Func and node.block.lines.length > 0
        lastLine = node.block.lines[node.block.lines.length-1]
        lastLine.implicitReturn = yes

# Translate a node into an array of strings.
# Required parameter/return attributes marked with *
# Parameters:
#  *node:       The node to translate
#   proc:       An array provided by the caller, where procedures go.
#   target:    * varname if we want the value assigned to a variable.
#              * undefined if the value is wanted, but no name is defined.         
#              * null if the value is not needed at all, only the procedure.
# Result:      * any expression if 'target' was undefined.
@translateOnce = _t_ = translateOnce = (node, {proc,target,context}) ->
  assert.ok proc, "proc must be an Array already provided"
  #console.log "translateOnce: node:#{node}, proc:#{proc}, target:#{target}, context:#{context}"

  valueOf = (node, options={}) ->
    options.proc ||= proc
    _t_ node, options
  addProcedure = (node, options={}) ->
    options.proc ||= proc
    options.target ||= if options.hasOwnProperty('target') then options.target else null
    _t_ node, options
  procedureOf = (node, options={}) ->
    options.proc ||= []
    options.target ||= if options.hasOwnProperty('target') then options.target else null
    _t_ node, options
    # remove trailing newline so the parent can outdent before final newline.
    options.proc.pop() if options.proc[options.proc.length-1] is NEWLINE and options.keepNewline isnt yes
    return options.proc
  passTo = (node, options={}) ->
    options.proc ||= proc
    options.target ||= if options.hasOwnProperty('target') then options.target else target
    options.context ||= context
    _t_ node, options
  simple = (value) ->
    #console.log "simple: value:#{value}, proc:#{proc}, target:#{target}, context:#{context}"
    if context?
      if context instanceof joe.Func
        extend proc, ["return ", value, ENDLINE, NEWLINE]
      else if context instanceof joe.Statement
        extend proc, ["#{context.type} ", value, ENDLINE, NEWLINE]
      else if context instanceof joe.Invocation
        assert.ok (context.params is undefined), "Invocation contexts should have no parameters"
        extend proc, [valueOf(context.func), "(", value..., ")", ENDLINE, NEWLINE]
      else
        throw new Error "Unexpected context #{context}"
      return null
    else if target?
      if target is value
        return value
      else
        extend proc, [valueOf(target), " = ", value, ENDLINE, NEWLINE]
        return null
    else if target is null
      extend proc, [value, ENDLINE, NEWLINE]
      return null
    else
      return value

  switch node.constructor

    when joe.Block
      assert.ok target isnt undefined, "Blocks can't have undefined targets"
      # output individual lines
      for line, i in node.lines
        if i is node.lines.length-1 and (target? or context?)
          assert.ok not target? or not context?, "You can't specify both"
          passTo line
        else
          addProcedure line
      # after all is done, prepend scope var declarations
      if node.ownScope?.variables?.length > 0
        proc[...0] = ["var #{node.scope.variables.join ', '}", ENDLINE, NEWLINE]
      return null # blocks dont have values.

    when joe.Index
      return simple "#{node}"

    when joe.Assign
      if target?
        extend proc, [target, " = ", valueOf(node.target), " #{node.type} ", valueOf(node.value), ENDLINE, NEWLINE]
        return null
      else if target is undefined or context?
        return simple ["(", valueOf(node.target), " #{node.type} ", valueOf(node.value), ")"]
      else # target is null
        addProcedure node.value, target:node.target
        return null

    when joe.If
      target = node.scope.makeTempVar() if target is undefined
      extend proc, [
        "if(", valueOf(node.cond), ") {", INDENT, NEWLINE,
            procedureOf(node.block, target:target, context:context), OUTDENT, NEWLINE,
        "}"
      ]
      if node.elseBlock?
        extend proc, [
          " else {", INDENT, NEWLINE,
              procedureOf(node.elseBlock, target:target, context:context), OUTDENT, NEWLINE,
          "}", NEWLINE
        ]
      else
        proc.push NEWLINE
      return target

    when joe.While, joe.Loop
      target ||= node.scope.makeTempVar() if (target is undefined) or context?

      # add label
      extend proc, ["#{node.label}:", NEWLINE] if node.label?

      if target? # or context?
        addProcedure joe.Assign(target:target, value:joe.Arr())
        extend proc, [
          "while(", valueOf(node.cond), ") {", INDENT, NEWLINE,
              procedureOf(node.block, proc:blockProc=[], context:joe.Invocation(func:joe.Index(obj:target, attr:'push'))), OUTDENT, NEWLINE,
          "}", NEWLINE
        ]
        return simple target
      else
        extend proc, [
          "while(", valueOf(node.cond), ") {", INDENT, NEWLINE,
              procedureOf(node.block, proc:blockProc=[]), OUTDENT, NEWLINE,
          "}", NEWLINE
        ]
        return null

    when joe.Operation
      joeOp = {'==':'===', 'is':'===', 'isnt':'!=='}[node.op] ? node.op
      return simple [(if node.not then "(!(" else "("), valueOf(node.left), " #{joeOp} ", valueOf(node.right), (if node.not then "))" else ")")]

    when joe.Invocation
      params = []
      for param, i in node.params
        params.push valueOf(param)
        params.push ", " if i isnt node.params.length-1
      return simple [valueOf(node.func), "(", params, ")"]

    when joe.Statement
      if node.expr?
        if node.expr.constructor in [joe.If] # these nodes pass the statement in
          passTo node.expr, context:node
        else
          extend proc, ["#{node.type} ", valueOf(node.expr), ENDLINE, NEWLINE]
      else
        extend proc, [node.type, ENDLINE, NEWLINE]
      return null # Statements never have value

    when joe.Obj
      target = node.scope.makeTempVar() if not target?
      # set static keys on target
      if node.items?.length > 0
        res = [target, ' = {', INDENT, NEWLINE]
        for item in node.items
          if item.key instanceof joe.Word or
             item.key instanceof joe.Str and item.key.isStatic
                extend res, [valueOf(item.key), ": ", valueOf(item.value), ', ', NEWLINE]
        res.pop() if res.length > 2 # remove the last ', '
        extend res, [OUTDENT, NEWLINE, '}', ENDLINE, NEWLINE]
      else
        res = [target, ' = {}', ENDLINE, NEWLINE]
      # set dynamic keys on target
      for item in node.items
        if item.key instanceof joe.Str and not item.key.isStatic
          extend res, [target, '[', valueOf(item.key), '] = ', valueOf(item.value), ENDLINE, NEWLINE]
      extend proc, res
      return simple target

    when joe.Arr
      return simple ["[", _.flatten([valueOf(item), ", "] for item in node.items||[])..., "]"]
      
    when joe.Func
      # Argument matching lines
      destructures = []
      # target: (Word/string, Arr, or Obj)
      # source: source var (Word/string or Index)
      match = (target, source) ->
        if target instanceof Arr
          match(item, joe.Index(source,joe.Str(idx))) for item, idx in target.items
        else if target instanceof Obj
          match(item.value, joe.Index(source,joe.Str(item.key))) for item in target.items
        else if target instanceof Word or typeof target is 'string'
          addProcedure joe.Assign(target:target, value:source), proc:destructures
        else
          throw Error "Unexpected target type #{target.constructor.name}, expected Arr/Obj/Word"
      # Collect top level param names and matches
      topParams = []
      if node.params? then for param, i in node.params
        if param instanceof joe.Word or typeof param is 'string'
          topParams.push valueOf(param)
          topParams.push ", " if i isnt node.params.length-1
        else
          topParams.push valueOf(tempName=node.scope.makeTempVar('_temparg', isParam:yes))
          topParams.push ", " if i isnt node.params.length-1
          match param, tempName
      return simple [
        "function(", topParams, ") {", INDENT, NEWLINE,
            procedureOf(node.block, context:node, proc:destructures), OUTDENT, NEWLINE,
        "}"
      ]

    when String, Number, Boolean, joe.Undefined, joe.Null, joe.Word
      return simple "#{node}"

    when joe.Str
      return simple "#{node}" if node.isStatic

    when joe.NativeExpression
      return simple "(#{node.exprStr})"

    else
      throw new Error "Dunno how to translate #{node} (#{node.constructor?.name})"

@translate = (node) ->
  node.prepare() if not node.prepared
  addImplicitReturns node

  indent = 0
  serialize = (thing) ->
    res = ''
    if typeof thing is 'string'
      res += thing
    else if typeof thing is 'number'
      res += "<debug:#{thing}>" # for debugging
    else if thing is INDENT
      ++indent
    else if thing is OUTDENT
      --indent
    else if thing is NEWLINE
      res += '\n'+Array(indent+1).join('  ')
    else if thing is ENDLINE
      res += ';'
    else if thing instanceof Array
      i = 0
      while i < thing.length
        res += serialize thing[i++]
    else if thing instanceof Function
      res += serialize(thing())
    else if thing?
      proc = []
      translateOnce thing, target:null, proc:proc
      res += serialize proc
    return res
  serialize(node)
