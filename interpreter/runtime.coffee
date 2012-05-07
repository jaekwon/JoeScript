{clazz} = require 'cardamom'

# TODO provisional
@RObject = RObject = clazz 'RObject', ->
  init: (items) ->
    @data = {}
    @prototype = undefined
