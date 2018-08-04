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

function read_account(callback) {
  fs.readFile('./account.txt', function (err, data) {
    if (err)
      throw err
    let arr = data.toString().split(' ')
    callback(arr[0].trim(), arr[1].trim())
  })
}

module.exports = {
  read: read,
  save: save,
  read_account: read_account,
}