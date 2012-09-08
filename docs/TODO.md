TODOS
* String/Number/etc constructors aren't available in interpreter/global.
* -> vs => binding
* Joeson parser should join strings automatically.

NOTES
* `slice` is awkward.
  A. `foo[bar...baz]` translates to `foo.slice`, while `[foo...] = bar` translates to `__slice(bar, ...)`.
  B. Joescript Array prototype is missing `slice` altogether.
  C. Joescript global is missing `__slice`, and I need to reserve that word (?)
  Z. Ideally I implement `slice` for Arrays, and arguments support `slice` (?)
