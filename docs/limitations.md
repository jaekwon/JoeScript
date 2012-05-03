Some known limitations of this parser;

Parses '3-2-1' right-recursively, which is unexpected. [source](http://tratt.net/laurie/research/publications/html/tratt__direct_left_recursive_parsing_expression_grammars/)
```
  START:   "EXPR"
  EXPR:
    EXPR1: "EXPR '-' EXPR"
    EXPR2: "NUM"
  NUM:     "/[0-9]+/"
```

Fails to parse 'xxxxx': counting problem.
```
  START:   "EXPR"
  EXPR:    "'x' EXPR 'x' | 'x'"
```
  
Fails to parse 'ababa' due to greediness. [source](http://news.ycombinator.com/item?id=2327865)
```
  START: "A | B"
  A:     "A 'a' | B | 'a'"
  B:     "B 'b' | A | 'b'"
```

