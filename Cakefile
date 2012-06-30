fs = require 'fs'
{spawn, exec} = require 'child_process'
log = console.log

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
          console.log "All tests OK"

task 'build:browser', 'rebuild the merged script for inclusion in the browser', ->
  code = """
    nonce = {nonce:'nonce'};
  """
  for {l:libname, f:filepath} in [
      # ./src/*
      {           l:'joeson',                f:'src/joeson'}
      {           l:'joeson/src/codestream', f:'src/codestream'}
      {           l:'joeson/src/joescript',  f:'src/joescript'}
      {           l:'joeson/src/node',       f:'src/node'}
      {           l:'joeson/src/interpreter/global',      f:'src/interpreter/global'}
      {           l:'joeson/src/interpreter/index',       f:'src/interpreter/index'}
      {           l:'joeson/src/interpreter/object',      f:'src/interpreter/object'}
      {           l:'joeson/src/interpreter/persistence', f:'src/interpreter/persistence'}
      {           l:'joeson/src/translators/javascript',  f:'src/translators/javascript'}
      {           l:'joeson/src/translators/scope',       f:'src/translators/scope'}
      # ./lib/*
      {           l:'joeson/lib/helpers',       f:'lib/helpers'}
      {           l:'assert',                   f:'lib/assert'}
      {           l:'util',                     f:'lib/util'}
      {           l:'events',                   f:'lib/events'}
      # cardamom
      {           l:'cardamom',                 f:'node_modules/cardamom/lib/cardamom'}
      {           l:'cardamom/src/bisect',      f:'node_modules/cardamom/lib/bisect'}
      {           l:'cardamom/src/clazz',       f:'node_modules/cardamom/lib/clazz'}
      {           l:'cardamom/src/collections', f:'node_modules/cardamom/lib/collections'}
      {           l:'cardamom/src/colors',      f:'node_modules/cardamom/lib/colors'}
      {           l:'cardamom/src/errors',      f:'node_modules/cardamom/lib/errors'}
      {           l:'cardamom/src/fnstuff',     f:'node_modules/cardamom/lib/fnstuff'}
      # underscore
      {           l:'underscore',               f:'node_modules/underscore/underscore'}
      # async
      {           l:'async',                    f:'node_modules/async/lib/async'}
      # nogg
      {           l:'nogg',                     f:'node_modules/nogg/lib/nogg'}
      {           l:'fs',                       f:'lib/dummy'}
      {           l:'path',                       f:'lib/dummy'}
    ]
      code += """
        require['#{libname}'] = function() {
          return new function() {
            var exports = require['#{libname}'] = this;
            var module = {exports:exports};
            #{ fs.readFileSync "#{filepath}.js" }
            require['#{libname}'] = module.exports;
          };
        };
        require['#{libname}'].nonce = nonce;
      """
  code = """
    (function(root) {
      var Sembly = function() {
        function require(path){
          var module = require[path];
          //console.log(path, Object.getOwnPropertyNames(require), module);
          if (!module) {
            throw new Error("Can't find module "+path);
          }
          if (module.nonce === nonce) {
            return module();
          }
          return module;
        }
        #{code}
        return require('joeson/src/interpreter/index');
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
