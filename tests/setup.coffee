# logging
require('nogg').configure
  'default': [
    {file: 'logs/test.log',    level: 'info'},
    {file: 'stdout',           level: 'info'},
  ]
# sugar
require('sugar')
