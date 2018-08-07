const moment = require('moment')

function d(s) {
  process.stdout.write(moment().format('YYYY/MM/DD HH:mm:ss:SSS: ') + s.toString() + '\n')
}

module.exports = {
  d: d,
}