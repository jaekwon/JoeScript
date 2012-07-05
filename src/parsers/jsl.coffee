# Joescript Serialization Language
# Joeson is the parser, so this is called something else. JSL, why not?
{Grammar} = require 'joeson'
jsi = require('joeson/src/interpreter').NODES

JSL = Grammar ({o, i, tokens}) -> [
  o ANY: [
    o NUMBER:       " /-?[0-9]+(\\.[0-9]+)?/ ", (it) -> Number it
    o STRING:       " '\"' (!'\"' &:(ESCSTR | .))* '\"'  ", (it) -> it.join ''
    o OBJ: [
      o             " '<#' id:ID '>' ", ({id}, $) ->
                      cached = $.env.thread.kernel.cache[id]
                      return cached if cached?
                      return jsi.JStub id
      o             " '{' type:[OAU] '|#' id:ID '@' creator:ID ' ' items:OBJ_ITEM*',' '}' ", ({type,id,creator,items}, $) ->
                      switch type
                        when 'O' then obj = new jsi.JObject id:id, creator:(new jsi.JStub creator)
                        when 'A' then obj = new jsi.JArray  id:id, creator:(new jsi.JStub creator)
                        when 'U' then obj = new jsi.JUser   name:id
                        else return cb("Unexpected type of object w/ id #{id}: #{type}")
                      $.env.thread.kernel.cache[id] = obj if id?
                      for {key, value} in items
                        obj.__set__($.env.thread, key, value)
                      return obj
    ]
    o BOOLEAN:      " 'true' | 'false' ", (it) -> it is 'true'
  ]
  i OBJ_ITEM:     " key:(NUMBER|STRING) ':' value:ANY "
  i ID:           " [a-zA-Z0-9]{1,24} ", (it) -> it.join ''
  i ESCSTR:       " '\\\\' . ", (it) -> {n:'\n', t:'\t', r:'\r'}[it] or it
  i '.':          " /[\\s\\S]/ "
]

@parse = (thread, str, opts) ->
  JSL.parse str, env:{thread}, debug:opts?.debug
