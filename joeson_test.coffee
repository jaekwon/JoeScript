# Tests that joeson can parse its own grammar.

{parseGrammar, Grammar, Context, Choice, Sequence, Lookahead, Exists, Not, Ref, String, Regex, Number} = require './joeson'
{CodeStream} =require './codestream'
{red, blue, cyan, magenta, green, normal, black, white, yellow} = require './colors'

pad = ({left,right}, str) ->
  if right? and right > str.length
    return Array(right-str.length+1).join(' ')+str
  else if left > str.length
    return str+Array(left-str.length+1).join(' ')
  return str

o = (rule, cb) -> rule: rule, cb: cb
UNTIL = (expr) -> "(!#{expr} ('\\\\' &:. | .))*"
GRAMMAR =
  START:                o "EXPR"
  EXPR:
    EXPR_:              o "&:$ _"
    CHOICE:             o "$*{_ '|';2,}",                                   ($1) -> Choice $1
    SEQUENCE:           o "$*{;2,}",                                        ($1) -> Sequence $1
    UNIT:
      _UNIT:            o "_ &:$"
      COMMAND:
        LA_CHAR:        o "'<chars:' chars:INT '>'",                        ($1) -> Lookahead $1
        LA_WORD:        o "'<words:' words:INT '>'",                        ($1) -> Lookahead $1
      LABELED:          o "@:(label:LABEL ':')? &:$"
      DECORATED:
        EXISTS:         o "&:PRIMARY '?'",                                  ($1) -> Exists $1
        PATTERN:        o """value:PRIMARY '*'
                          @:('{' join:EXPR? ';'
                               _ min:INT? _ ','
                               _ max:INT? _ '}')?""",                       ($1) -> Pattern $1
        NOT:            o "'!' &:PRIMARY",                                  ($1) -> Not $1
      PRIMARY:
        REF:            o "'$$' | '$' | WORD",                              ($1) -> Ref $1
        PAREN:          o "'(' &:EXPR ')'"
        STRING:         o "'\\'' &:#{UNTIL "'\"'"} '\\''",                  ($1) -> String $1.join ''
        REGEX:          o "'/'   &:#{UNTIL "'/'"}  '/'",                    ($1) -> Regex $1.join ''
  NUMERIC:
    INT:                o "<words:1> /[0-9]+/",                             ($1) -> Number $1
  OTHER:
    LABEL:              o "'&' | '@' | WORD"
    WORD:               o "<words:1> /[a-zA-Z\\._]+/"
    '.':                o "TERM | <chars:1> /./"
    _:                  o "(WHITESPACE | TERM)*"
    TERM:               o "'\n'"
    WHITESPACE:         o "<words:1> / +/"

testGrammar = (rank, indent=0, debug=false) ->
  for own key, value of rank
    if typeof value.rule is 'string'
      {result, code} = parseGrammar code:value.rule, debug:debug
      console.log "#{Array(indent*2+1).join ' '}#{red pad left:(20-indent*2), key+':'}"+
                  "#{if result? then yellow result else red result} #{white code.peek chars:10}"
    else
      console.log "#{Array(indent*2+1).join ' '}#{red key+':'}"
      return if not testGrammar value, indent+1, debug
  yes

if true
  start = new Date()
  for i in [0..10]
    testGrammar GRAMMAR
  console.log new Date() - start

if false
  testGrammar {FOO: {rule: "$*{_ '|';2,}"}}, 0, true

if true
  GRAMMAR = Grammar
    START: Ref('HEADR')
    HEADR: Choice([Sequence([Ref('HEADR'), String('r')]), String('head')])._cb (x) -> if typeof x is 'string' then x else x.join('')

  parseGrammar = ({code}) ->
    code = CodeStream code if code not instanceof CodeStream
    context = Context code
    GRAMMAR.parse context
    context.result

  console.log parseGrammar code:"headrrrr"
  console.log parseGrammar code:"hadrrrr"
