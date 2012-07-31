### Welcome to Sembly

Sembly is an operating system for the web. It is designed for the common man to author, run, and share programs and data amongst peers and across devices.

##### :: Usage ::

Imagine if everyone were available in a global namespace...
```coffeescript
@Bob  # {name: 'Bob Dylan', location: undefined}
@Joe  # {name: 'Joe Shmoe', location: 'San Francisco, CA'}
```

To send a message to `@Joe`, it would be great if all `@Bob` had to do was:
```coffeescript
# Logged in as user @Bob
@Joe.write "Whatup!"
```

With Sembly, it's as simple as can be.
```coffeescript
# Logged in as user @Joe
@Joe.write = (msg) ->
  @messages = [] if @messages is undefined
  @messages.push msg
  'Message sent successfully'
```

##### :: Demo ::

TODO Link to demo

##### :: Language ::

* TODO Notes on Joeson parser and grammar.
* TODO Notes on relationship to CoffeeScript.

##### :: Architecture ::

* Programs are authored in JoeScript (a language derived from Javascript/CoffeeScript),
* and run in a multi-user/multi-threaded environment
* Objects are shared and persisted by a Redis bridge,
* and synchronized with the client, which updates the view.

##### :: License ::

* AGPL3.0

##### :: Development ::

compiling sass: sass --watch scss:static

##### :: Developer Resources ::

* TODO Signup page
* irc: `#sembly` on `irc.freenode.net`
* email: `jkwon.work@gmail.com`
