require 'sugar'
assert = require 'assert'
findit = require 'findit'

compact = (array) -> item for item in array when item

# modules:    An array of {name:MODULE, path:PATH},
#             MODULE is a string that represents a module name.
#             E.g. you would require(MODULE) to import a module.
#             PATH is a string of the source file (or directory, see below) with an optional suffix.
#             If PATH ends with '/**.SUFFIX', it takes all files inside the directory (recursively),
#
# compilers:  (Optional) An object of {SUFFIX:COMPILER},
#             SUFFIX is the file suffix that the compiler recognizes. e.g. 'coffee'
#             COMPILER is a function, takes a source code string and returns the compiled javascript.
module.exports = (modules, options) ->
  compilers = options?.compilers ? {}
  compilers['js'] ?= (code) -> code
  rootDir = options?.rootDir ? ''
  main = options?.main
  globalSetupCode = options?.globalSetupCode ? ''
  moduleSetupCode = options?.moduleSetupCode ? ''
  assert.ok main?.module? and main?.name?, "options.main should be {name:VAR_NAME, module:MODULE_NAME}"

  toCompile = [] # array of {file:FILENAME, fn:COMPILER, name:MODULENAME}
  knownSuffixes = Object.keys(compilers)

  for {name, path} in modules
    path = rootDir+path if not path.startsWith '/'
    [_, dirpath, suffixFilter] = path.match(/(.*?)\/\*\*\.([a-zA-Z0-9]+)$/) ? []
    if dirpath
      for filepath in findit.findSync(dirpath)
        [_, filename, suffix] = filepath.match(/(.*?)(?:\.([a-zA-Z0-9]+))?$/)
        continue if not suffix
        continue if suffixFilter and suffix isnt suffixFilter
        relpath = filename[dirpath.length...]
        relpath = relpath[1..] if relpath.startsWith '/'
        if relpath is 'index'
          modulename = name or 'index'
        else if relpath.endsWith '/index'
          modulename = compact([name, relpath[...-6]]).join('/')
        else
          modulename = compact([name, relpath]).join('/')
        compiler = compilers[suffix]
        continue if not compiler
        toCompile.push {file:filepath, fn:compiler, name:modulename}
    else
      filepath = path
      [_, filename, suffix] = filepath.match(/(.*?)(?:\.([a-zA-Z0-9]+))?$/)
      compiler = compilers[suffix]
      throw new Error "Dunno how to compile '#{filepath}' with #{suffix} suffix" if not compiler
      toCompile.push {file:filepath, fn:compiler, name:name}

  # look for dupes
  _files = {}
  _modules = {}
  for {file,name} in toCompile
    console.log "WARN: Duplicate file #{file}" if _files[file]
    throw new Error "Duplicate module #{name}" if _modules[name]
    _files[file] = _modules[name] = yes

  # console.log toCompile
  derequired = ''
  for {file,name,fn} in toCompile
    source = require('fs').readFileSync file, 'utf8'
    compiled = fn(source)
    # console.log "#{compiled.length}\t #{file} (#{name})"
    derequired += """
      require['#{name}'] = function() {
        return new function() {
          var exports = require['#{name}'] = this;
          var module = {exports:exports};
          #{ moduleSetupCode }
          var __filename = "#{file}";
          #{ compiled }
          return (require['#{name}'] = module.exports);
        };
      };
      require['#{name}'].nonce = nonce;\n\n
    """

  return """
    (function(root) {
      var #{main.name} = function() {
        var nonce = {nonce:'nonce'};
        function require(path){
          var module = require[path];
          if (!module) {
            throw new Error("Can't find module "+path);
          }
          if (module.nonce === nonce) {
            module = module();
            return module;
          } else {
            return module;
          }
        }
        #{ derequired }
        return require('#{main.module}');
      }();

      #{ globalSetupCode }

    }(this));
  """
