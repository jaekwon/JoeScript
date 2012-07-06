fs = require 'fs'
{spawn, exec} = require 'child_process'
log = console.log
sugar = require 'sugar'

task 'build', ->
  run 'coffee -c src/*.coffee'
  run 'coffee -c src/**/*.coffee'
  run 'coffee -c lib/*.coffee'
  #run 'coffee -c lib/**/*.coffee'

task 'test', ->
  run 'coffee tests/joeson_test.coffee', ->
    run 'coffee tests/joescript_test.coffee', ->
      run 'coffee tests/translator_test.coffee', ->
        run 'coffee tests/interpreter_test.coffee', ->
          run 'coffee tests/jsl_test.coffee', ->
            console.log "All tests OK"

task 'build:browser', 'rebuild the merged script for inclusion in the browser', ->
  code = """
    nonce = {nonce:'nonce'};
  """
  for {l:libname, f:filepath} in [
      # ./src/*
      {           l:'joeson',                   f:'src/joeson'}
      {           l:'joeson/src/codestream',    f:'src/codestream'}
      {           l:'joeson/src/joescript',     f:'src/joescript'}
      {           l:'joeson/src/node',          f:'src/node'}
      {           l:'joeson/src/interpreter',             f:'src/interpreter/index'}
      {           l:'joeson/src/interpreter/instructions',f:'src/interpreter/instructions'}
      {           l:'joeson/src/interpreter/object',      f:'src/interpreter/object'}
      {           l:'joeson/src/interpreter/eventful',    f:'src/interpreter/eventful'}
      {           l:'joeson/src/interpreter/global',      f:'src/interpreter/global'}
      {           l:'joeson/src/interpreter/persistence', f:'src/interpreter/persistence'}
      {           l:'joeson/src/translators/javascript',  f:'src/translators/javascript'}
      {           l:'joeson/src/translators/scope',       f:'src/translators/scope'}
      {           l:'joeson/src/client',                  f:'src/client/index'}
      {           l:'joeson/src/client/dom',              f:'src/client/dom'}
      {           l:'joeson/src/parsers/ansi',            f:'src/parsers/ansi'}
      {           l:'joeson/src/parsers/jsl',             f:'src/parsers/jsl'}
      {           l:'joeson/lib/helpers',       f:'lib/helpers'}
      # browserify builtins
      {           l:'_process',                 f:'node_modules/browserify/builtins/__browserify_process'}
      {           l:'assert',                   f:'node_modules/browserify/builtins/assert'}
      {           l:'util',                     f:'node_modules/browserify/builtins/util'}
      {           l:'events',                   f:'node_modules/browserify/builtins/events'}
      {           l:'buffer',                   f:'node_modules/browserify/builtins/buffer'}
      {           l:'buffer_ieee754',           f:'node_modules/browserify/builtins/buffer_ieee754'}
      #{           l:'path',                     f:'node_modules/browserify/builtins/path'}
      {           l:'fs',                       f:'node_modules/browserify/builtins/fs'}
      # cardamom
      {           l:'cardamom',                 f:'node_modules/cardamom/lib/cardamom'}
      {           l:'cardamom/src/bisect',      f:'node_modules/cardamom/lib/bisect'}
      {           l:'cardamom/src/clazz',       f:'node_modules/cardamom/lib/clazz'}
      {           l:'cardamom/src/collections', f:'node_modules/cardamom/lib/collections'}
      {           l:'cardamom/src/colors',      f:'node_modules/cardamom/lib/colors'}
      {           l:'cardamom/src/errors',      f:'node_modules/cardamom/lib/errors'}
      {           l:'cardamom/src/fnstuff',     f:'node_modules/cardamom/lib/fnstuff'}
      # sugar
      {           l:'sugar',                    f:'node_modules/sugar/release/1.2.5/development/sugar-1.2.5-core.development'}
      # async
      {           l:'async',                    f:'node_modules/async/lib/async'}
      # nogg
      {           l:'nogg',                     f:'node_modules/nogg/lib/nogg'}
    ]
      code += """
        require['#{libname}'] = function() {
          return new function() {
            var exports = require['#{libname}'] = this;
            var module = {exports:exports};
            var process = require('_process');
            var __filename = "#{filepath}.js";
            #{ fs.readFileSync "#{filepath}.js" }
            return (require['#{libname}'] = module.exports);
          };
        };
        require['#{libname}'].nonce = nonce;\n\n
      """
  code = """
    (function(root) {
      var Sembly = function() {
        function require(path){
          var module = require[path];
          console.log("+"+path);
          if (!module) {
            throw new Error("Can't find module "+path);
          }
          if (module.nonce === nonce) {
            module = module();
            console.log("!"+path, typeof module);
            return module;
          } else {
            console.log("."+path, typeof module);
            return module;
          }
        }
        #{code}
        require('sugar');
        return require('joeson/src/client');
      }();

      if (typeof define === 'function' && define.amd) {
        define(function() { return Sembly; });
      } else { 
        root.Sembly = Sembly; 
      }
    }(this));
  """
  #unless process.env.MINIFY is 'false'
  #  {parser, uglify} = require 'uglify-js'
  #  code = uglify.gen_code uglify.ast_squeeze uglify.ast_mangle parser.parse code
  fs.writeFileSync 'static/sembly.js', code
  console.log "built ... running browser tests:"

run = (args...) ->
  for a in args
    switch typeof a
      when 'string' then command = a
      when 'object'
        if a instanceof Array then params = a
        else options = a
      when 'function' then callback = a
  
  command += ' ' + params.join ' ' if params?
  cmd = spawn '/bin/sh', ['-c', command], options
  cmd.stdout.on 'data', (data) -> process.stdout.write data
  cmd.stderr.on 'data', (data) -> process.stderr.write data
  process.on 'SIGHUP', -> cmd.kill()
  cmd.on 'exit', (code) -> callback() if callback? and code is 0
