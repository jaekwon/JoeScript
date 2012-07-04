# logging
require('nogg').configure
  'default': [
    {file: 'logs/test.log',    level: 'debug'},
    {file: 'stdout',           level: 'info'},
  ]
# sugar
require('sugar')
