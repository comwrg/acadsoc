const moment = require('moment')

function d(s) {
  process.stdout.write(moment().format('YYYY/MM/DD hh:mm:ss: ') + s.toString() + '\n')
}

module.exports = {
  d: d,
}