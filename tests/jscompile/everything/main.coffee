identity = (x) -> x
func = switch 1+2
  when 3
    identity
  when "wrong"
    undefined
  else
    null
exports.complete = func yes
