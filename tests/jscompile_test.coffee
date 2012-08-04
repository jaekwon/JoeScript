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
# The 'module' module is returned during evaluation, for 'cb' to validate.
counter = 0
test = (dir, cb) ->
  console.log "#{red "test #{counter++}"}: tests/jscompile/#{dir}"
  source = demodule [{name:dir, path:'tests/jscompile/'+dir+'/**.coffee'}], {
    compilers:  compilers,
    main:       {name:'MAIN', module:dir+'/main'},
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
