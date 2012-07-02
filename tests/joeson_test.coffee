require './setup'

# Uses the existing Joeson grammar to parse the grammar RAW_GRAMMAR.
# The resulting object, another parser (which is also a Joeson parser), is
# used to parse its own grammar RAW_GRAMMAR.
# The console output shows some benchmark data.
#
# NOTE: keep this grammar in sync with src/joeson.coffee
# Once we have a compiler, we'll just move this into src/joeson.coffee.

{NODES, GRAMMAR, MACROS, Grammar, Choice, Sequence, Lookahead, Existential, Pattern, Not, Ref, Str, Regex} = require 'joeson'
{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{pad, escape} = require 'joeson/lib/helpers'

{o, i, t} = MACROS
QUOTE = "'\\''"
FSLSH = "'/'"
LBRAK = "'['"
RBRAK = "']'"
LCURL = "'{'"
RCURL = "'}'"
RAW_GRAMMAR = [
  o EXPR: [
    o "CHOICE _"
    o "CHOICE": [
      o "_PIPE* SEQUENCE*_PIPE{2,} _PIPE*", (it) -> new Choice it
      o "SEQUENCE": [
        o "UNIT{2,}", (it) -> new Sequence it
        o "UNIT": [
          o "_ LABELED"
          o "LABELED": [
            o "(label:LABEL ':')? &:(DECORATED|PRIMARY)"
            o "DECORATED": [
              o "PRIMARY '?'", (it) -> new Existential it
              o "value:PRIMARY '*' join:(!__ PRIMARY)? @:RANGE?", (it) -> new Pattern it
              o "value:PRIMARY '+' join:(!__ PRIMARY)?", ({value,join}) -> new Pattern value:value, join:join, min:1
              o "value:PRIMARY @:RANGE", (it) -> new Pattern it
              o "'!' PRIMARY", (it) -> new Not it
              o "'(?' expr:EXPR ')' | '?' expr:EXPR", (it) -> new Lookahead it
              i "RANGE": "'{' _ min:INT? _ ',' _ max:INT? _ '}'"
            ]
            o "PRIMARY": [
              o "WORD", (it) -> new Ref it
              o "'(' inlineLabel:(WORD ': ')? expr:EXPR ')' ( _ '->' _ code:CODE )?", ({expr, code}) ->
                {Func} = require('joeson/src/joescript').NODES
                {BoundFunc, Context} = require('joeson/src/interpreter')
                if code?
                  params = expr.labels
                  cbFunc = new Func params:params, type:'->', block:code
                  cbBFunc = new BoundFunc func:cbFunc, context:Context(global:@env.global)
                  expr.cb = cbBFunc.function
                return expr
              i CODE: "#{LCURL} (!#{RCURL} (ESC1 | .))* #{RCURL}", (it) -> require('joeson/src/joescript').parse(it.join '')
              o "#{QUOTE} (!#{QUOTE} (ESC1 | .))* #{QUOTE}", (it) -> new Str       it.join ''
              o "#{FSLSH} (!#{FSLSH} (ESC2 | .))* #{FSLSH}", (it) -> new Regex     it.join ''
              o "#{LBRAK} (!#{RBRAK} (ESC2 | .))* #{RBRAK}", (it) -> new Regex "[#{it.join ''}]"
            ]
          ]
        ]
      ]
    ]
  ]
  i LABEL:      "'&' | '@' | WORD"
  i WORD:       "/[a-zA-Z\\._][a-zA-Z\\._0-9]*/"
  i INT:        "/[0-9]+/", (it) -> new Number it
  i _PIPE:      "_ '|'"
  i _:          "(' ' | '\n')*"
  i __:         "(' ' | '\n')+"
  i '.':        "/[\\s\\S]/"
  i ESC1:       "'\\\\' ."
  i ESC2:       "'\\\\' .", (chr) -> '\\'+chr
]

PARSED_GRAMMAR = Grammar RAW_GRAMMAR

testGrammar = (rule, indent=0, name=undefined) ->
  if rule instanceof Array
    console.log "#{Array(indent*2+1).join ' '}#{red name+":"}" if name
    testGrammar r, indent+1 for r in rule
  else if rule instanceof MACROS.o
    [rule, callback] = rule.args
    testGrammar rule, indent, name
  else if rule instanceof MACROS.i
    for name, value of rule.args[0]
      testGrammar value, indent, name
  else if typeof rule is 'string'
    {result, code} = PARSED_GRAMMAR.parse rule, debug:no, returnContext:yes #, env:{global:NODES}
    #{result, code} = GRAMMAR.parse rule, debug:no, returnContext:yes
    console.log "#{Array(indent*2+1).join ' '
                }#{if name? then red pad(left:(10-indent*2), name+':') else ''
                }#{if result? then yellow result else red result} #{white code.peek afterChars:10}"
  else
    for name, r of rule
      testGrammar r, indent, name

console.log blue "\n-= self-parse test =-"
start = new Date()
for i in [0..10]
  testGrammar RAW_GRAMMAR
console.log new Date() - start
