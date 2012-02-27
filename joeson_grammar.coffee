# This will parse the grammar below

{GRAMMAR, Grammar, Nodeling, Choice, Sequence, Lookahead, Exists, Pattern, Not, Ref, String, Regex} = require './joeson'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'

pad = ({left,right}, str) ->
  if right? and right > str.length
    return Array(right-str.length+1).join(' ')+str
  else if left > str.length
    return str+Array(left-str.length+1).join(' ')
  return str

o = (rule, cb) -> Nodeling rule: rule, cb: cb
QUOTE = "'\\''"
FSLSH = "'/'"
SLASH = "'\\\\'"
RAW_GRAMMAR =
  START:                o "EXPR"
  EXPR:
    EXPR_:              o "&:$ _"
    CHOICE:             o "$*{_ '|';2,}", Choice
    SEQUENCE:           o "$*{;2,}", Sequence
    UNIT:
      UNIT_:            o "_ &:$"
      COMMAND:
        LA_CHAR:        o "'<chars:' chars:INT '>'", Lookahead
        LA_WORD:        o "'<words:' words:INT '>'", Lookahead
      LABELED:          o "@:(label:LABEL ':')? &:$"
      DECORATED:
        EXISTS:         o "&:PRIMARY '?'", Exists
        PATTERN:        o """value:PRIMARY '*'
                          @:('{' join:EXPR? ';'
                               _ min:INT? _ ','
                               _ max:INT? _ '}')?""", Pattern
        NOT:            o "'!' &:PRIMARY", Not
      PRIMARY:
        REF:            o "'$$' | '$' | WORD", Ref
        PAREN:          o "'(' &:EXPR ')'"
        STRING:         o "#{QUOTE} &:(!#{QUOTE} (ESC1 | .))* #{QUOTE}", (it) -> String it.join ''
        REGEX:          o "#{FSLSH} &:(!#{FSLSH} (ESC2 | .))* #{FSLSH}", (it) -> Regex it.join ''
        '':
          ESC1:         o "#{SLASH} &:."
          ESC2:         o "#{SLASH} .", (it) -> it.join ''
  '':
    NUMERIC:
      INT:              o "<words:1> /[0-9]+/", Number
    OTHER:
      LABEL:            o "'&' | '@' | WORD"
      WORD:             o "<words:1> /[a-zA-Z\\._][a-zA-Z\\._0-9]*/"
      '.':              o "<chars:1> /[\\s\\S]/"
      _:                o "(WHITESPACE | TERM)*"
      TERM:             o "'\n'"
      WHITESPACE:       o "<words:1> / +/"

PARSED_GRAMMAR = Grammar RAW_GRAMMAR

testGrammar = (rank, indent=0) ->
  for own key, value of rank
    if typeof value.rule is 'string'
      {result, code} = PARSED_GRAMMAR.parse value.rule
      console.log "#{Array(indent*2+1).join ' '}#{red pad left:(20-indent*2), key+':'}"+
                  "#{if result? then yellow result else red result} #{white code.peek chars:10}"
    else
      console.log "#{Array(indent*2+1).join ' '}#{red key+':'}"
      return if not testGrammar value, indent+1
  yes

if true
  start = new Date()
  for i in [0..10]
    testGrammar RAW_GRAMMAR
  console.log new Date() - start

if false
  testGrammar {FOO: {rule: "$*{_ '|';2,}"}}, 0, true
