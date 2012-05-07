This is a left-recursive packrat parser with familiar Regex syntax, inspired by CoffeeScript and PegJs, for the purpose of parsing CoffeeScript and other languages.
This is also quickly becoming a CoffeeScript interpreter, analyzer, and translator.

## Requirements

You need CoffeeScript >= 1.3.0.

Also, npm install . for dependencies.

## Parser details

* The parser is essentially a left-recursive packrat parser, as far as I can tell.
* It's like a memoized top-down recursive descent parser (PEG) but with the added ability to parse non-ambiguous left-recursive grammars (like post-if statements).
* It is not a general CFG parser. Some limitations in docs/limitations.md

## Roadmap

* Finish the simple interpreter/*. -= DOING =-
* Use the interpreter/* to statically analyze and reduce joeson.coffee into an optimized AST. -= DOING =-
    1. Assume NATIVE OBJECTS and FUNCTIONS, because i want to use Cardamom/Clazz as the native library (for now).
    2. During RUNTIME, however, everything will be INTERPRETED by Joe.
    3. There shall be a step to OPTIMIZE a FUNCTION STATICALLY given some binding to THIS and some STATIC OBJECTS.
    4. The STATIC OBJECTS shall be signified as such by having a special __joe_static_fields__ = yes, which means none of the object fields can change.
    5. optimize = (func <joe.BFunc>) -> optimized <joe.BFunc>
* Use the translator/* to print the optimized AST.

## Structure

```
* joeson.coffee                    This is the parser logic.
* joescript_grammar.coffee         This file contains nodes/grammar for Joescript. The AST nodes defined here will be used throughout the project.
* joescript_grammar.joe            Same as above except it contains some grammar data in code syntax in the form of a callback function.
                                   I found the syntax to be much better than using explicit arrays.
                                   Eventually both files will be merged into one, when Coffee/Joe gains runtime access to its AST.
* interpreter/
  * javascript.coffee              Interpreter for JoeScript under the javascript runtime.
* translator/
  * javascript.coffee              Translator for JoeScript into javascript code.
* tests/
  * joeson_grammar_test.coffee     This parses joeson grammar against itself and does a benchmark test. Just run the file.
  * joescript_grammar_test.coffee  This file tests the parsing of all the code in the project. Run the file, and fix joescript_grammar if it's broken.
```

## Contributing

I hope to keep this section up to date so that anybody can dive in and work in this project. If you can read this,
I'm probably working on this project, so just contact me if you have any questions.
