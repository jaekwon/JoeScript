require 'sugar'

{clazz, colors:{red, blue, cyan, magenta, green, normal, black, white, yellow}} = require('cardamom')
{inspect} = require 'util'
assert = require 'assert'
async = require 'async'
{pad, escape, starts, ends} = require 'sembly/lib/helpers'
{debug, info, warn, fatal} = require('nogg').logger __filename.split('/').last()

{JObject, JArray, JUndefined, JNull, JNaN, JStub, JBoundFunc} = require 'sembly/src/interpreter/object'

# Caches.
# TODO weak references
CACHE             = @CACHE =            {}

if window?
  PERSISTENCE = undefined
else
  {JPersistence} = p = require 'sembly/src/interpreter/persistence'
  PERSISTENCE = new JPersistence()

GOD     = @GOD   = CACHE['god']   = new JObject id:'god',   creator:null, data:name:'God'
ANON    = @ANON  = CACHE['anon']  = new JObject id:'anon',  creator:GOD, data:name:'Anonymous'
if require.main is module
  USERS = @USERS = CACHE['users'] = new JObject id:'users', creator:GOD, data:
    god:    GOD
    anon:   ANON
else
  USERS = @USERS                  = new JStub   id:'users', persistence:PERSISTENCE
WORLD   = @WORLD = CACHE['world'] = new JObject id:'world', creator:GOD, data:
  this:   USERS
  users:  USERS
  login:  ($, something) ->
          console.log something
          return "it worked!"

WORLD.hack_persistence = PERSISTENCE # FIX

{JKernel} = require 'sembly/src/interpreter/kernel'
KERNEL = @KERNEL = new JKernel cache:CACHE
KERNEL.emitter.on 'shutdown', -> PERSISTENCE?.client.quit()

# run this file to set up redis
if require.main is module
  PERSISTENCE?.attachTo WORLD
  KERNEL.run user:GOD, code:'yes', callback: (err) ->
    return console.log "FAIL!\n#{err.stack ? err}" if err?
    WORLD.emit thread:@, type:'new'
    @callback = (err) -> # callback after reanimation
      return console.log "FAIL!\n#{err.stack ? err}" if err?
      PERSISTENCE.client.quit() # TODO
      console.log "done!"
else
  PERSISTENCE?.attachTo WORLD, recursive:yes # HACK, we could just load the globals from REDIS instead?
