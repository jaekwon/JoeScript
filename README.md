# Joeson

This is a left-recursive packrat parser with familiar Regex syntax, inspired by CoffeeScript and PegJs, for the purpose of parsing CoffeeScript and other languages.
This is also quickly becoming a CoffeeScript interpreter, analyzer, and translator.

## Requirements

You need CoffeeScript >= 1.3.0.

> npm link .<br/>
> npm link joeson<br/>
> npm install .

## Parser details

* The parser is essentially a left-recursive packrat parser.
* It's like a memoized top-down recursive descent parser (PEG) but with the added ability to parse non-ambiguous left-recursive grammars (like post-if statements).
* It is not a general CFG parser. Some limitations in docs/limitations.md

## Contributing

I hope to keep this section up to date so that anybody can dive in and work in this project. If you can read this,
I'm probably working on this project, so just contact me if you have any questions.
