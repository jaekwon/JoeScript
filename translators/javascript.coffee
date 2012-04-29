assert = require 'assert'
_ = require 'underscore'
js = require('../joescript_grammar').NODES

INDENT  = type:'INDENT'
OUTDENT = type:'OUTDENT'
NEWLINE = type:'NEWLINE'
ENDLINE = type:'ENDLINE'

valueOf = (node, db=0) -> translateOnce node:node, target:undefined, db:db
procedureOf = (node, db=1) ->
  result = translateOnce(node:node, target:null, db:db)
  (result.procedure||=[]).push result.value if result.value?
  return result
extend = (dest, source) -> dest[dest.length...] = source

# Step to convert the last expression into a return statement.
addImplicitReturns = (node) ->
  node.walk
    pre: (parent, node) ->
      if node instanceof js.NODES.Func
        node.block

# Translate a node into an array of strings.
# Required parameter/return attributes marked with *
# Parameters:
#  *node:       The node to translate
#   target:    * varname if we want the value assigned to a variable.
#              * undefined if the value is wanted, but no name is defined.         
#              * null if the value is not needed at all, only the procedure.
# Result:
#   procedure:  Any procedure represented by node, or any procedure needed
#               for the final value of the node.
#               Null or undefined if no procedure was generated.
#   value:     * varname if 'target' varname was present.
#              * any expression if 'target' was undefined.
#              * appended to procedure, when target was null.
@translateOnce = translateOnce = ({node,target,proc,db}) ->
  result = _translateOnce node:node, target:target, proc:proc, db:db
  if target?
    return procedure:result.procedure
  return result

_translateOnce = ({node,target,proc,db}) ->
  assert.ok node?, "parameter 'node' is required. node:#{node}. target:#{target}. db:#{db}"
  value = undefined
  proc ||= []

  switch node.constructor

    when js.Block
      # output scope var declarations
      if node.ownScope?.vars?.length > 0
        extend proc, ["var #{node.scope.vars.join ','}", ENDLINE, NEWLINE]
      # output individual lines
      for line, i in node.lines
        if i is node.lines.length-1 and target?
          # the last line is the target value.
          extend proc, [(translateOnce(node:line, target:target, proc:proc, db:2)), ENDLINE, NEWLINE]
        else
          extend proc, [line, ENDLINE, NEWLINE if i isnt node.lines.length-1]
      return value:target, procedure:proc

    when js.Index
      return procedureOf(js.Assign(target:target, value:node), 'A') if target?
      return value:"#{node}", procedure:null

    when js.Assign
      return procedureOf(js.Assign(target:target, value:node), 'B') if target?
      if target is null
        return procedure:[valueOf(node.target, 'C'), " #{node.type} ", valueOf(node.value, 'D')]
      else # target is undefined
        #return value:["(", valueOf(node.target, 'E'), " #{node.type} ", valueOf(node.value, 'F'), ")"]
        return translateOnce(node:node.value, target:node.target, db:2.5)

    when js.If
      if node.elseBlock?
        proc.push [
          "if(", valueOf(node.cond, 'G1'), ") {", INDENT, NEWLINE,
              (translateOnce(node:node.block, target:target, db:3)), OUTDENT, NEWLINE,
          "} else {", INDENT, NEWLINE,
              (translateOnce(node:node.elseBlock, target:target, db:4)), OUTDENT, NEWLINE,
          "}"
        ]
      else
        proc.push [
          "if(", valueOf(node.cond, 'G2'), ") {", INDENT, NEWLINE,
              (translateOnce(node:node.block, target:target, db:5)), OUTDENT, NEWLINE,
          "}"
        ]
      return value:target, procedure:proc

    when js.While, js.Loop
      if target?
        proc.push [
          js.Assign(target:target, value:js.Arr()),
          "while(", node.cond, ") {", INDENT, NEWLINE,
              @Invocation(@Index(target,'push'), valueOf(node.block, 'H')), OUTDENT, NEWLINE,
          "}"
        ]
      else
        proc.push [
          "while(", node.cond, ") {", INDENT, NEWLINE,
              node.block, OUTDENT, NEWLINE,
          "}"
        ]
      return value:target, procedure:proc

    when js.Operation
      return procedureOf(js.Assign(target:target, value:node), 'I') if target?
      jsOp = {'==':'===', 'is':'===', 'isnt':'!=='}[node.op] ? node.op
      return value: [(if node.not then "(!(" else "("), valueOf(node.left,'J1'), " #{jsOp} ", valueOf(node.right,'J2'), (if node.not then "))" else ")")]

    when js.Invocation
      return procedureOf(js.Assign(target:target, value:node), 'K') if target?
      return value: [valueOf(node.func, 'L1'), "(", (valueOf(param, 'L2') for param in node.params), ")"]

    when js.Statement
      if node.expr?
        return value: [node.type, " ", node.expr]
      else
        return value: node.type

    when js.Obj
      target = node.scope.makeTempVar() if not target?
      # set static keys on target
      res = [target, '= {', INDENT, NEWLINE]
      for item in node.items
        if item.key instanceof js.Word or
           item.key instanceof js.Str and item.key.isStatic
              extend res, [item.key, ": ", item.value, ', ']
      res.pop() if res.length > 2 # remove the last ', '
      res.push [OUTDENT, NEWLINE, '}', ENDLINE, NEWLINE]
      # set dynamic keys on target
      for item in node.items
        if item.key instanceof js.Str and not item.key.isStatic
          extend res, [target, '[', valueOf(item.key, 'M'), '] = ', valueOf(item.value, 'N'), ENDLINE, NEWLINE]
      proc.push res
      return value:target, procedure:proc
      
    when js.Func
      return procedureOf(js.Assign(target:target, value:node), 'O') if target?
      # Argument matching lines
      destructures = []
      # target: (Word/string, Arr, or Obj)
      # source: source var (Word/string or Index)
      match = (target, source) ->
        if target instanceof Arr
          match(item, js.Index(source,js.Str(idx))) for item, idx in target.items
        else if target instanceof Obj
          match(item.value, js.Index(source,js.Str(item.key))) for item in target.items
        else if target instanceof Word or typeof target is 'string'
          destructures.push js.Assign target:target, value:source
        else
          throw Error "Unexpected target type #{target.constructor.name}, expected Arr/Obj/Word"
      # Collect top level param names and matches
      paramNames = []
      if node.params? then for param in node.params
        if param instanceof js.Word or typeof param is 'string'
          paramNames.push param
        else
          paramNames.push tempName=node.scope.makeTempVar('_temparg', isParam:yes)
          match param, tempName
      return value:["function(", paramNames, ") {", INDENT, NEWLINE, destructures, node.block, OUTDENT, NEWLINE, "}"]

    when String, Boolean, Number, js.Undefined, js.Null, js.Word
      return procedureOf(js.Assign(target:target, value:node), 'P') if target?
      return value:''+node

    when null, undefined
      return value:'' # TODO consider correctness of this

    else
      # TODO replace with real-time error
      return value:["(throw new Error \"Unknown thing #{node.constructor.name} #{node}\")"]

  return undefined

@translate = (node) ->
  indent = 0
  serialize = (thing) ->
    res = ''
    if typeof thing is 'string'
      res += thing
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
    else if thing instanceof js.Node
      result = translateOnce node:thing, target:undefined, db:6
      res += serialize result
    else if thing instanceof Object
      assert.ok thing.procedure? or thing.value?, "Serialize function expects objects to be {procedure,value} type"
      if thing.procedure? and not thing.procedure.seen
        thing.procedure.seen = yes
        res += serialize thing.procedure
      #res += serialize [ENDLINE, NEWLINE] if thing.procedure? and thing.value?
      res += serialize thing.value if thing.value?
    else if thing?
      result = translateOnce node:thing, target:undefined, db:6
      res += serialize result
    return res
  serialize(node)
