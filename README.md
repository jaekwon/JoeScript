This is a left-recursive packrat parser with familiar Regex syntax, inspired by CoffeeScript and PegJs, for the purpose of parsing CoffeeScript and other languages.

The parser works, just run `coffee joescript_grammar_test` to see it parse all the code in this project.

## Requirements

You need CoffeeScript >= 1.3.0.

Also, npm install . for dependencies.

## Parser details

* The parser is essentially a left-recursive packrat parser, as far as I can tell.
* It's like a memoized top-down recursive descent parser (PEG) but with the added ability to parse non-ambiguous left-recursive grammars (like post-if statements).
* It is not a general CFG parser. Some limitations below:

```
  START:   "EXPR"
  EXPR:
    EXPR1: "EXPR '-' EXPR"
    EXPR2: "NUM"
  NUM:     "/[0-9]+/"

  parses '3-2-1' right-recursively, which is unexpected.
```

```
  START:   "EXPR"
  EXPR:    "'x' EXPR 'x' | 'x'"

  fails to parse 'xxxxx': counting problem.
```
  
```
  START: "A | B"
  A:     "A 'a' | B | 'a'"
  B:     "B 'b' | A | 'b'"

  fails to parse 'ababa' due to greediness.
```

## Roadmap

* The immediate roadmap is to modify joeson.coffee to generate optimized parser code, for performance reasons.

## Structure

* joeson.coffee                  This is the parser logic.
* joeson_grammar.coffee          This parses joeson grammar against itself and does a benchmark test. Just run the file.
* joescript_grammar.coffee       This file contains nodes/grammar for Joescript. The AST nodes defined here will be used throughout the project.
* joescript_grammar.joe          Same as above except it contains some grammar data in code syntax in the form of a callback function.
                                 I found the syntax to be much better than using explicit arrays.
                                 Eventually both files will be merged into one, when Coffee/Joe gains runtime access to its AST.
* joescript_grammar_test.coffee  This file tests the parsing of all the code in the project. Run the file, and fix joescript_grammar if it's broken.

## Contributing

I hope to keep this section up to date so that anybody can dive in and work in this project. If you can read this,
I'm probably working on this project, so just contact me if you have any questions.
