# http://news.ycombinator.com/item?id=2327313

{Grammar} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'
{clazz} = require 'cardamom'
assert = require 'assert'

Node = clazz 'Node'
Dummy = clazz 'Dummy', Node, ->
  init: (@args) ->
  toString: -> "{#{"(#{arg})" for arg in @args}}"

counter = 0
test  = (grammar, code, expected) ->
  # hack to make tests easier to write.
  code = code.replace(/\\/g, '\\\\').replace(/\r/g, '\\r')
  try
    context = grammar.parse code, debug:no
    assert.equal ''+context.result, expected
  catch error
    if expected isnt null
      try
        grammar.parse code, debug:yes
      catch error
        # pass
      console.log "Failed to parse code:\n#{red code}\nExpected:\n#{expected}\nResult:\n#{yellow context?.result}"
      throw error
  console.log "t#{counter++} OK\t#{code}"

test (Grammar ({o, t}) ->
  START: o "A | B"
  A:     o "A 'a' | B | 'a'"
  B:     o "B 'b' | A | 'b'"
), "ababa", "x,x,xa,b,a"

test (Grammar ({o, t}) ->
  START:   o "EXPR"
  EXPR:
    EXPR1: o "EXPR '-' EXPR", Dummy
    EXPR2: o "NUM"
  NUM:     o "<words:1> /[0-9]+/"
), "3-2-1", "x,x,xa,b,a"

test (Grammar ({o, t}) ->
  START:   o "EXPR"
  EXPR:    o "'x' EXPR 'x' | 'x'"
), "xxxxx", "xxxxx"
