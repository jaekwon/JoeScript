###
Concerns:
  * permissions (ACL)
  * concurrency (interwoven within a line of process,
                 simultaneous amongst processes.)
  * performance
  * networking  (future)

i9n: short for instruction
###

trace = debug:no, logCode:no

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{randid, pad, escape, starts, ends} = require 'sembly/lib/helpers'
{
  NODES:joe
  HELPERS: {extend, isVariable}
} = require('sembly/src/joescript')

{@NODES, @HELPERS} = {NODES:{JObject, JArray, JUndefined, JNull, JNaN, JBoundFunc}} = require 'sembly/src/interpreter/object'
{@INSTR} = require 'sembly/src/interpreter/instructions'
{@JKernel, @JThread, @JStackItem} = require 'sembly/src/interpreter/kernel'
@GLOBALS = require 'sembly/src/interpreter/global'
