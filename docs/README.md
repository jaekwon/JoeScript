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

## Todo

DONE 1. change scopes into JObjects
1.1 pesist everything?
1.2 give everyone a namespace?
1.3 let people recall old source easily.
2. add a changelog to JThread.

## Premises

0 Garbage collection

0.0 Need a small object and a large object.
   -> small objects get persisted at once.
   -> large objects get persisted in pieces, with an index of key.
   -> start with just small objects.

0.1 DB needs to take 1 or 2 keys, and it should handle compaction.

0.2 DB needs to live forever

0.3 DB needs to be easily horizontally scalable.

1 Multicore concurrency

1.0 Each thread, only after completion, can actually commit to shared memory.

1.1 Add primitives to commit during execution if wanted... Maybe these become implicit threads.

1.2 Redis is a good starting platform for this kind of communication

2 Multimachine synchrony

2.0 Just how much can we assume, in terms of transparency between (1) and (2)?
