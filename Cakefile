fs = require 'fs'
{spawn, exec} = require 'child_process'
log = console.log
sugar = require 'sugar'

task 'build', ->
  run 'coffee -c src/*.coffee'
  run 'coffee -c src/**/*.coffee'
  run 'coffee -c lib/*.coffee'
  #run 'coffee -c lib/**/*.coffee'

task 'install', 'install JoeScript into /usr/local (or --prefix)', (options) ->
  run 'cake build', ->
    base = options.prefix or '/usr/local'
    lib  = "#{base}/lib/joescript"
    bin  = "#{base}/bin"
    node = "~/.node_libraries/joescript"
    console.log   "Installing JoeScript to #{lib}"
    console.log   "Linking to #{node}"
    console.log   "Linking 'joe' to #{bin}/joe"
    exec([
      "mkdir -p #{lib} #{bin}"
      "cp -rf bin lib LICENSE README.md package.json src node_modules #{lib}"
      "ln -sfn #{lib}/bin/joe #{bin}/joe"
      "ln -sfn #{lib}/bin/joke #{bin}/joke"
      #"mkdir -p ~/.node_libraries"
      #"ln -sfn #{lib}/lib/joescript #{node}"
    ].join(' && '), (err, stdout, stderr) ->
      if err then console.log stderr.trim() else log 'done'
    )

task 'test', ->
  run 'cake build', ->
    run 'coffee tests/codestream_test.coffee', ->
      run 'coffee tests/joeson_test.coffee', ->
        run 'coffee tests/joescript_test.coffee', ->
          run 'coffee tests/translator_test.coffee', ->
            run 'coffee tests/jscompile_test.coffee', ->
              console.log "All tests OK"

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
