let fs = require('fs')

const filename = './time.json'

function read(callback) {
  fs.readFile(filename, function (err, data) {
    if (err) {
      callback([])
    } else {
      callback(JSON.parse(data))
    }
  })
}

function save(time) {
  fs.writeFile(filename, JSON.stringify(time), function () {
    
  })
}

module.exports = {
  read: read,
  save: save,
}