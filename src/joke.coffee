# `joke` is analogous to JoeScript's `make` for JoeScript.
# You define tasks with names and descriptions in a Jokefile,
# and can call them from the command line, or invoke them from other tasks.
#
# Running `joke` with no arguments will print out a list of all the tasks in the
# current directory's Jokefile

# External dependencies.
fs           = require 'fs'
path         = require 'path'
helpers      = require '../lib/helpers'
optparse     = require '../lib/optparse'
JoeScript    = require './joescript'

existsSync   = fs.existsSync or path.existsSync

# Keep track of the list of defined tasks, the accepted options, and so on.
tasks     = {}
options   = {}
switches  = []
oparse    = null

# Mixin the top-level Joke functions for Jokefiles to use directly.
helpers.extend global,

  # Define a Joke task with a short name, an optional sentence description,
  # and the function to run as the action itself.
  task: (name, description, action) ->
    [action, description] = [description, action] unless action
    tasks[name] = {name, description, action}

  # Define an option that the Jokefile accepts. The parsed options hash,
  # containing all of the command-line options passed, will be made available
  # as the first argument to the action.
  option: (letter, flag, description) ->
    switches.push [letter, flag, description]

  # Invoke another task in the current Jokefile.
  invoke: (name) ->
    missingTask name unless tasks[name]
    tasks[name].action options

# Run `joke`. Executes all of the tasks you pass, in order. Note that Node's
# asynchrony may cause tasks to execute in a different order than you'd expect.
# If no tasks are passed, print the help screen. Keep a reference to the
# original directory name, when running Joke tasks from subdirectories.
exports.run = ->
  global.__originalDirname = fs.realpathSync '.'
  process.chdir jokefileDirectory __originalDirname
  args = process.argv[2..]
  JoeScript.run input:fs.readFileSync('Jokefile').toString(), file: 'Jokefile'
  oparse = new optparse.OptionParser switches
  return printTasks() unless args.length
  try
    options = oparse.parse(args)
  catch e
    return fatalError "#{e}"
  invoke arg for arg in options.arguments

# Display the list of Joke tasks in a format similar to `rake -T`
printTasks = ->
  relative = path.relative or path.resolve
  jokefilePath = path.join relative(__originalDirname, process.cwd()), 'Jokefile'
  console.log "#{jokefilePath} defines the following tasks:\n"
  for name, task of tasks
    spaces = 20 - name.length
    spaces = if spaces > 0 then Array(spaces + 1).join(' ') else ''
    desc   = if task.description then "# #{task.description}" else ''
    console.log "joke #{name}#{spaces} #{desc}"
  console.log oparse.help() if switches.length

# Print an error and exit when attempting to use an invalid task/option.
fatalError = (message) ->
  console.error message + '\n'
  console.log 'To see a list of all tasks/options, run "joke"'
  process.exit 1

missingTask = (task) -> fatalError "No such task: #{task}"

# When `joke` is invoked, search in the current and all parent directories
# to find the relevant Jokefile.
jokefileDirectory = (dir) ->
  return dir if existsSync path.join dir, 'Jokefile'
  parent = path.normalize path.join dir, '..'
  return jokefileDirectory parent unless parent is dir
  throw new Error "Jokefile not found in #{process.cwd()}"
