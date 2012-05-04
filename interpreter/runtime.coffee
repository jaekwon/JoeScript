{clazz} = require 'cardamom'

@RObject = RObject = clazz 'RObject', ->
  init: (items) ->
    @data = {}
    @prototype = undefined
