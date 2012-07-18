require 'sugar'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{pad, escape, starts, ends} = require 'joeson/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{JStub, JObject, JArray, JUser, JUndefined, JNull, JNaN} = require 'joeson/src/interpreter/object'

# Caches.
# TODO weak references
CACHE             = @CACHE =            {}
NATIVE_FUNCTIONS  = @NATIVE_FUNCTIONS = {}

if window?
  PERSISTENCE = undefined
else
  {JPersistence} = p = require 'joeson/src/interpreter/persistence'
  PERSISTENCE = new JPersistence()

GOD     = @GOD   = CACHE['god']   = new JUser   id:'god',   name:'God'
ANON    = @ANON  = CACHE['anon']  = new JUser   id:'anon',  name:'Anonymous'
if require.main is module
  USERS = @USERS = CACHE['users'] = new JObject id:'users', creator:GOD, data:
    god:    GOD
    anon:   ANON
else
  USERS = @USERS                  = new JStub   id:'users', persistence:PERSISTENCE
WORLD   = @WORLD = CACHE['world'] = new JObject id:'world', creator:GOD, data:
  users:  USERS
  this:   USERS
PERSISTENCE?.listenOn WORLD

{JKernel} = require 'joeson/src/interpreter/kernel'
KERNEL = @KERNEL = new JKernel cache:CACHE, nativeFunctions:NATIVE_FUNCTIONS
KERNEL.emitter.on 'shutdown', -> PERSISTENCE?.client.quit()

# run this file to set up redis
if require.main is module
  KERNEL.run user:GOD, code:'dontcare', callback: (err) ->
    return console.log "FAIL!\n#{err.stack ? err}" if err?
    WORLD.emit thread:@, type:'new'
    @callback = (err) -> # callback after reanimation
      return console.log "FAIL!\n#{err.stack ? err}" if err?
      PERSISTENCE.client.quit() # TODO
      console.log "done!"
