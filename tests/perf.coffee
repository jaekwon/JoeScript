require './setup'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{
  JThread, JKernel,
  GLOBALS:{KERNEL, ANON}
  NODES:{JObject}
} = require 'sembly/src/interpreter'

console.log process.memoryUsage()
lots = ((new JObject creator:ANON, data:{blah:'BLAH'}) for i in [...1000000])
console.log lots.length
console.log process.memoryUsage()
