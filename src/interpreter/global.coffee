{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
_ = require 'underscore'
async = require 'async'
{pad, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, error:fatal} = require('nogg').logger 'server'

{JObject, JArray, JUser, JUndefined, JNull, JNaN} = require 'joeson/src/interpreter/object'

# A way to pretend that native functions have an id.
NATIVE_FUNCTIONS = {}
nativ = @nativ = (id, f) ->
  assert.ok id?, "NaFu wants an id"
  f.id = id
  NATIVE_FUNCTIONS[id] = f
  return f

GOD   = @GOD   = new JUser   id:'god',   name:'god'
GUEST = @GUEST = new JUser   id:'guest', name:'guest'
USERS = @USERS = new JObject id:'users', creator:GOD, data:{guest:GUEST, god:GOD}
WORLD = @WORLD = new JObject id:'world', creator:GOD, data:
  users: USERS
  print: nativ 'print', ($, [obj]) ->
    $.output(obj.__html__($) + '<br/>')
    return JUndefined

if require.main is module
  {saveJObject} = require 'joeson/src/interpreter/persistence'
  saveJObject WORLD
