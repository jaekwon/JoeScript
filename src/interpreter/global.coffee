{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{pad, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{JObject, JArray, JUser, JUndefined, JNull, JNaN} = require 'joeson/src/interpreter/object'
{nativ} = require 'joeson/src/interpreter/persistence'

CACHE = @CACHE = {} # weak ref? TODO. HACKY

GOD   = @GOD   = new JUser   id:'god',   name:'god'
ANON  = @ANON  = new JUser   id:'anon',  name:'anon'
USERS = @USERS = new JObject id:'users', creator:GOD, data:
  god:    GOD
  anon:   ANON
WORLD = @WORLD = new JObject id:'world', creator:GOD, data:
  users:  USERS
  this:   USERS

{JKernel} = require 'joeson/src/interpreter/kernel'
KERNEL = @KERNEL = new JKernel cache:CACHE # HACK

# run this file to set up redis
if require.main is module
  {saveJObject, loadJObject} = require 'joeson/src/interpreter/persistence'
  saveJObject WORLD, (err) ->
    return console.log "FAIL!"+err if err?
    console.log "done saving globals"

    loadJObject 'world', (err, it) ->
      console.log "test loaded world:\n#{inspect it.data}"
