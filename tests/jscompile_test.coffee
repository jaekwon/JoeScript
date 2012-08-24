require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = assert = require 'assert'
joe = require 'sembly/src/joescript'
jsx = require 'sembly/src/translators/javascript'
demodule = require 'sembly/lib/demodule'

console.log blue "\n-= javascript compiler test =-"

compilers =
  coffee: (source) ->
    node = joe.parse ''+source
    translated = jsx.translate(node)
    return translated

# This test looks for directories in test/jscompile/ and bundles all the
# compiled javascript files into a single source string, then evals it.
# The main module is returned during evaluation, for 'cb' to validate.
counter = 0
test = (requires, cb) ->
  console.log "#{red "test #{counter++}"}: #{inspect requires}"
  if typeof requires is 'string'
    dir = requires
    requires = [{name:'', path:'tests/jscompile/'+dir+'/**.coffee'}]
  source = demodule requires, {
    compilers:  compilers,
    main:       {name:'MAIN', module:'main'},
    globalSetupCode: 'return MAIN;'
  }
  try
    result = eval(source)
    cb.call {it:result}, result
  catch error
    console.log "Error in evaluating translated javascript: #{yellow source}.\nError:\n#{red error?.stack ? error}"
    process.exit(1)
  return

test 'sample', -> equal @it.sample, 'S4MPLE'
test 'everything', -> equal @it.complete, yes
test 'coffeemugg', -> console.log @it
#test [{name:'joeson', path:'src/joeson.coffee'}], -> console.log @it
