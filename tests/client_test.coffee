require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
{equal, deepEqual, ok} = require 'assert'

console.log blue "\n-= client test =-"

Sembly = require 'sembly/src' # Sembly would be given in the browser.
node = Sembly.parse 'foo + bar'
Sembly.run node, {foo:1, bar:2}, 100, (err, res) ->
  if err?
    console.log "ERROR", err
    return
  equal res, 3
  console.log "ok!"
  require('sembly/src/interpreter/global').KERNEL.shutdown()
