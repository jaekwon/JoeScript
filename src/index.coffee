require 'sugar'
assert = require 'assert'

# Require modules
@require     = require
{NODES:joe}  = require 'sembly/src/joescript'
@interpreter = interpreter = require 'sembly/src/interpreter'
{toHTML}     = require 'sembly/src/parsers/ansi'

# Configure logging
if window?
  domLog = window.domLog = $('#log')
  require('nogg').configure
    default:
      file:
        write: (line) ->
          if window.domLog?.length > 0
            window.domLog.append toHTML line
          else
            console.log line
          null
      level: 'debug'

# Convenience function for parsing code for interpretation.
# Returns an AST node, to be passed into 'run'
@parse = (code) ->
  return code if code instanceof joe.Node
  node = require('sembly/src/joescript').parse code
  node = node.toJSNode(toVal:yes).installScope().determine()
  node.validate()
  return node

@run = (node, scope, timeout, callback) ->
  assert.ok node instanceof joe.Node, "sembly/src/index/run wants a Joescript node for 'node'"
  {KERNEL, WORLD, ANON} = require 'sembly/src/interpreter/global'
  if scope not instanceof interpreter.JObject
    # convert scope to JObject.
    assert.ok scope.__proto__ is Object.prototype, "Currently only simple objects are supported for scope."
    scope = scope.toJoe(creator:ANON)
    scope.proto = WORLD
  KERNEL.run user:ANON, code:node, scope:scope, timeout:timeout, callback: ->
    callback(@error?.jsValue(), @last?.jsValue())
