# TODO: s/coffee/joe/g
# External dependencies.
fs             = require 'fs'
path           = require 'path'
helpers        = require 'joescript/lib/helpers'
optparse       = require 'joescript/lib/optparse'
JoeScript      = require 'joescript/src/joescript'
{inspect}      = require 'util'
{spawn, exec}  = require 'child_process'
{EventEmitter} = require 'events'

# Allow JoeScript to emit Node.js events.
helpers.extend JoeScript, new EventEmitter

printLine = (line) -> process.stdout.write line + '\n'
printWarn = (line) -> process.stderr.write line + '\n'

hidden = (file) -> /^\.|~$/.test file

# The help banner that is printed when `coffee` is called without arguments.
BANNER = '''
  Usage: coffee [options] path/to/script.coffee -- [args]

  If called without options, `coffee` will run your script.
'''

# The list of all the valid option flags that `coffee` knows how to handle.
SWITCHES = [
  ['-b', '--bare',            'compile without a top-level function wrapper']
  ['-c', '--compile',         'compile to JavaScript and save as .js files']
  ['-d', '--debug',           'show parsing process debug output']
  ['-e', '--eval',            'pass a string from the command line as input']
  ['-h', '--help',            'display this help message']
  #['-i', '--interactive',     'run an interactive JoeScript REPL']
  ['-n', '--nodes',           'print out the parse tree that the parser produces']
  [      '--nodejs [ARGS]',   'pass options directly to the "node" binary']
  ['-o', '--output [DIR]',    'set the output directory for compiled JavaScript']
  ['-p', '--print',           'print out the compiled JavaScript']
  ['-s', '--stdio',           'listen for and compile scripts over stdio']
  ['-v', '--version',         'display the version number']
  ['-w', '--watch',           'watch scripts for changes and rerun commands']
]

# Top-level objects shared by all the functions.
opts         = {}
sources      = []
sourceCode   = []
optionParser = null

# Run `coffee` by parsing passed options and determining what action to take.
# Many flags cause us to divert before compiling anything. Flags passed after
# `--` will be passed verbatim to your script as arguments in `process.argv`
exports.run = ->
  parseOptions()
  return forkNode()                      if opts.nodejs
  return usage()                         if opts.help
  return version()                       if opts.version
  #return require './repl'                if opts.interactive
  if opts.watch and !fs.watch
    return printWarn "The --watch feature depends on Node v0.6.0+. You are running #{process.version}."
  return compileStdio()                  if opts.stdio
  return compileScript null, sources[0]  if opts.eval
  #return require './repl'                unless sources.length
  literals = if opts.run then sources.splice 1 else []
  process.argv = process.argv[0..1].concat literals
  process.argv[0] = 'coffee'
  process.execPath = require.main.filename
  for source in sources
    compilePath source, yes, path.normalize source

# Compile a path, which could be a script or a directory. If a directory
# is passed, recursively compile all '.coffee' extension source files in it
# and all subdirectories.
compilePath = (source, topLevel, base) ->
  fs.stat source, (err, stats) ->
    throw err if err and err.code isnt 'ENOENT'
    if err?.code is 'ENOENT'
      if topLevel and source[-7..] isnt '.coffee'
        source = sources[sources.indexOf(source)] = "#{source}.coffee"
        return compilePath source, topLevel, base
      if topLevel
        console.error "File not found: #{source}"
        process.exit 1
      return
    if stats.isDirectory()
      watchDir source, base if opts.watch
      fs.readdir source, (err, files) ->
        throw err if err and err.code isnt 'ENOENT'
        return if err?.code is 'ENOENT'
        index = sources.indexOf source
        files = files.filter (file) -> not hidden file
        sources[index..index] = (path.join source, file for file in files)
        sourceCode[index..index] = files.map -> null
        files.forEach (file) ->
          compilePath (path.join source, file), no, base
    else if topLevel or path.extname(source) is '.coffee'
      watch source, base if opts.watch
      fs.readFile source, (err, code) ->
        throw err if err and err.code isnt 'ENOENT'
        return if err?.code is 'ENOENT'
        compileScript(source, code.toString(), base)
    else
      throw new Error "Not source: #{source}"

# Compile a single source script, containing the given code, according to the
# requested options. If evaluating the script directly sets `__filename`,
# `__dirname` and `module.filename` to be correct relative to the script's path.
compileScript = (file, input, base) ->
  o = opts
  o.wrapInClosure = o.bare
  try
    t = task = {file, input, opts}
    JoeScript.emit 'compile', task
    if o.nodes or o.debug then printLine JoeScript.parse(task).serialize()
    else if o.run         then JoeScript.run task
    else
      t.output = JoeScript.translateJavascript task
      JoeScript.emit 'success', task
      if o.print          then printLine t.output.trim()
      else if o.compile   then writeJs t.file, t.output, base
  catch err
    JoeScript.emit 'failure', err, task
    return if JoeScript.listeners('failure').length
    return printLine err.message + '\x07' if o.watch
    printWarn err instanceof Error and err.stack or "ERROR: #{err}"
    process.exit 1

# Attach the appropriate listeners to compile scripts incoming over **stdin**,
# and write them back to **stdout**.
compileStdio = ->
  code = ''
  stdin = process.openStdin()
  stdin.on 'data', (buffer) ->
    code += buffer.toString() if buffer
  stdin.on 'end', ->
    compileScript null, code

# Get the corresponding output JavaScript path for a source file.
outputPath = (source, base) ->
  filename  = path.basename(source, path.extname(source)) + '.js'
  srcDir    = path.dirname source
  baseDir   = if base is '.' then srcDir else srcDir.substring base.length
  dir       = if opts.output then path.join opts.output, baseDir else srcDir
  path.join dir, filename

# Write out a JavaScript source file with the compiled code. By default, files
# are written out in `cwd` as `.js` files with the same name, but the output
# directory can be customized with `--output`.
writeJs = (source, js, base) ->
  jsPath = outputPath source, base
  jsDir  = path.dirname jsPath
  compile = ->
    js = ' ' if js.length <= 0
    fs.writeFile jsPath, js, (err) ->
      if err
        printLine err.message
      else if opts.compile and opts.watch
        timeLog "compiled #{source}"
  fs.exists jsDir, (exists) ->
    if exists then compile() else exec "mkdir -p #{jsDir}", compile

# Convenience for cleaner setTimeouts.
wait = (milliseconds, func) -> setTimeout func, milliseconds

# When watching scripts, it's useful to log changes with the timestamp.
timeLog = (message) ->
  console.log "#{(new Date).toLocaleTimeString()} - #{message}"

# Use the [OptionParser module](optparse.html) to extract all options from
# `process.argv` that are specified in `SWITCHES`.
parseOptions = ->
  optionParser  = new optparse.OptionParser SWITCHES, BANNER
  o = opts      = optionParser.parse process.argv[2..]
  o.compile     or=  !!o.output
  o.run         = not (o.compile or o.print)
  o.print       = !!  (o.print or (o.eval or o.stdio and o.compile))
  sources       = o.arguments
  sourceCode[i] = null for source, i in sources
  return

# Start up a new Node.js instance with the arguments in `--nodejs` passed to
# the `node` binary, preserving the other options.
forkNode = ->
  nodeArgs = opts.nodejs.split /\s+/
  args     = process.argv[1..]
  args.splice args.indexOf('--nodejs'), 2
  spawn process.execPath, nodeArgs.concat(args),
    cwd:        process.cwd()
    env:        process.env
    customFds:  [0, 1, 2]

# Print the `--help` usage message and exit. Deprecated switches are not
# shown.
usage = ->
  printLine (new optparse.OptionParser SWITCHES, BANNER).help()

# Print the `--version` message and exit.
version = ->
  printLine "JoeScript version #{JoeScript.VERSION}"
