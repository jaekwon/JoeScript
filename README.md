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

* Finish the simple interpreter/*.
* Use the interpreter/* to statically analyze and reduce joeson.coffee into an optimized AST. (Important here is the notion of customized hints, like frozen objects).
* Use the translator/* to print the optimized AST.

## Structure

TODO update with new structure and files

* joeson.coffee                  This is the parser logic.
* joescript_grammar.coffee       This file contains nodes/grammar for Joescript. The AST nodes defined here will be used throughout the project.
* joescript_grammar.joe          Same as above except it contains some grammar data in code syntax in the form of a callback function.
                                 I found the syntax to be much better than using explicit arrays.
                                 Eventually both files will be merged into one, when Coffee/Joe gains runtime access to its AST.
* joeson_grammar_test.coffee     This parses joeson grammar against itself and does a benchmark test. Just run the file.
* joescript_grammar_test.coffee  This file tests the parsing of all the code in the project. Run the file, and fix joescript_grammar if it's broken.

## Contributing

I hope to keep this section up to date so that anybody can dive in and work in this project. If you can read this,
I'm probably working on this project, so just contact me if you have any questions.
