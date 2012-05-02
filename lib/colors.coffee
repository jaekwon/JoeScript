# ripped from fabric.

_wrap_with = (code) ->
  return (text, bold) ->
    return "\x1b[#{if bold then '1;' else ''}#{code}m#{text}\x1b[0m"

@black = _wrap_with('30')
@red = _wrap_with('31')
@green = _wrap_with('32')
@yellow = _wrap_with('33')
@blue = _wrap_with('34')
@magenta = _wrap_with('35')
@cyan = _wrap_with('36')
@white = _wrap_with('37')
@normal = (text) -> return text
