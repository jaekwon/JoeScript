(function() {
  var GLOBALS, Grammar, JArray, JBoundFunc, JNaN, JNull, JObject, JSL, JStub, JUndefined, JUser, isInteger, isObject, setLast, _ref, _ref2, _ref3;

  Grammar = require('joeson').Grammar;

  _ref = require('joeson/src/interpreter'), (_ref2 = _ref.NODES, JObject = _ref2.JObject, JArray = _ref2.JArray, JUser = _ref2.JUser, JUndefined = _ref2.JUndefined, JNull = _ref2.JNull, JNaN = _ref2.JNaN, JBoundFunc = _ref2.JBoundFunc, JStub = _ref2.JStub), GLOBALS = _ref.GLOBALS, (_ref3 = _ref.HELPERS, isInteger = _ref3.isInteger, isObject = _ref3.isObject, setLast = _ref3.setLast);

  JSL = Grammar(function(_arg) {
    var i, o, tokens;
    o = _arg.o, i = _arg.i, tokens = _arg.tokens;
    return [
      o({
        ANY: [
          o({
            NUMBER: " /-?[0-9]+(\\.[0-9]+)?/ "
          }, function(it) {
            return Number(it);
          }), o({
            STRING: " '\"' (!'\"' &:(ESCSTR | .))* '\"'  "
          }, function(it) {
            return it.join('');
          }), o({
            OBJ: [
              o(" '<#' id:ID '>' ", function(_arg2, $) {
                var cached, id;
                id = _arg2.id;
                cached = $.env.thread.kernel.cache[id];
                if (cached != null) return cached;
                return JStub(id);
              }), o(" '{' type:[OAU] '|#' id:ID '@' creator:ID ' ' items:OBJ_ITEM*',' '}' ", function(_arg2, $) {
                var creator, id, items, key, obj, type, value, _i, _len, _ref4;
                type = _arg2.type, id = _arg2.id, creator = _arg2.creator, items = _arg2.items;
                switch (type) {
                  case 'O':
                    obj = new JObject({
                      id: id,
                      creator: new JStub(creator)
                    });
                    break;
                  case 'A':
                    obj = new JArray({
                      id: id,
                      creator: new JStub(creator)
                    });
                    break;
                  case 'U':
                    obj = new JUser({
                      name: id
                    });
                    break;
                  default:
                    return cb("Unexpected type of object w/ id " + id + ": " + type);
                }
                if (id != null) $.env.thread.kernel.cache[id] = obj;
                for (_i = 0, _len = items.length; _i < _len; _i++) {
                  _ref4 = items[_i], key = _ref4.key, value = _ref4.value;
                  obj.__set__($.env.thread, key, value);
                }
                return obj;
              })
            ]
          }), o({
            BOOLEAN: " 'true' | 'false' "
          }, function(it) {
            return it === 'true';
          })
        ]
      }), i({
        OBJ_ITEM: " key:(NUMBER|STRING) ':' value:ANY "
      }), i({
        ID: " [a-zA-Z0-9]{1,24} "
      }, function(it) {
        return it.join('');
      }), i({
        ESCSTR: " '\\\\' . "
      }, function(it) {
        return {
          n: '\n',
          t: '\t',
          r: '\r'
        }[it] || it;
      }), i({
        '.': " /[\\s\\S]/ "
      })
    ];
  });

  this.parse = function(thread, str, opts) {
    return JSL.parse(str, {
      env: {
        thread: thread
      },
      debug: opts != null ? opts.debug : void 0
    });
  };

}).call(this);
