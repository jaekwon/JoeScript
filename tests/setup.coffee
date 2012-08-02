# logging
require('nogg').configure
  'default': [
    # {file: 'logs/test.log',    level: 'error'},
    {file: 'stdout',           level: 'debug'},
  ]
# sugar
require('sugar')
