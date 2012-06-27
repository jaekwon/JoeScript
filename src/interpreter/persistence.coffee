###

1. change scopes into JObjects
2. add a changelog to JThread
3.


Premises:

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

###
