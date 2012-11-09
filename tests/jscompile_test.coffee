require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = assert = require 'assert'
joe = require '../src/joescript'
jsx = require '../src/translators/javascript'
demodule = require '../lib/demodule'

console.log blue "\n-= javascript compiler test =-"

compilers =
  coffee: (source) ->
    node = joe.parse {input:''+source}
    translated = jsx.translate(node, includeHelpers:no)
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
    compilers:      compilers,
    main:           {name:'MAIN', module:'main'},
    beforePackage:  require('../src/translators/javascript').allHelpers(),
    afterPackage:   'return MAIN;'
  }
  try
    sourceAST = require('uglify-js').parser.parse(source)
    source =    require('uglify-js').uglify.gen_code(sourceAST, beautify:yes, indent_level:2)
    console.log blue source
    result = eval(source)
    cb.call {it:result}, result
  catch error
    #console.log "Error in evaluating translated javascript: #{yellow source}.\nError:\n#{red error?.stack ? error}"
    console.log "Error in evaluating translated javascript: #{red error?.stack ? error}"
    process.exit(1)
  return

test 'sample', -> equal @it.sample, 'S4MPLE'
test 'everything', -> equal @it.complete, yes
test 'coffeemugg', -> equal @it.result, 0 # 0 errors
#test [{name:'joeson', path:'src/joeson.coffee'}], -> console.log @it
