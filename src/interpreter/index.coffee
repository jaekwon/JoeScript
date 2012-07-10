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

{randid, pad, escape, starts, ends} = require 'joeson/lib/helpers'
{
  NODES:joe
  HELPERS: {extend, isVariable}
} = require('joeson/src/joescript')

{@NODES, @HELPERS} = {NODES:{JObject, JArray, JUser, JUndefined, JNull, JNaN, JBoundFunc}} = require 'joeson/src/interpreter/object'
{@JKernel, @JThread, @JStackItem} = require 'joeson/src/interpreter/kernel'
@GLOBALS = {GOD, WORLD, ANON, KERNEL} = require 'joeson/src/interpreter/global'
