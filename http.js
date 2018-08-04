let http = require('http')
let fs = require('fs')
let api = require('./api.js')
let schedule = require('node-schedule')
let moment = require('moment')
let conf = require('./conf.js')
require('date-utils')
let indexhtml
let time

function debug(s) {
  process.stdout.write(moment().format('YYYY/MM/DD hh:mm:ss: ') + s + '\n')
}

fs.readFile('./index.html', 'utf-8', function (err, data) {
  if (err) {
    process.stderr.write(err)
    process.exit(1)
  }

  indexhtml = data

})

let server = http.createServer(function (req, resp) {
  let body = [];
  req.on('data', function (chunk) {
    body.push(chunk)
  }).on('end', function () {
    body = Buffer.concat(body).toString();

    if (req.url === '/book') {
      try {
        let json = JSON.parse(body)

        time = time.filter(function (i) {
          return (i.time !== json.time) || (i.weekday !== json.weekday)
        })
        time.push(json)

        resp.writeHead(200)
        resp.end(JSON.stringify(time))
        conf.save(time)
      } catch (e) {
        process.stderr.write(e)
        resp.writeHead(404)
        resp.end()
      }
    } else if (req.url === '/cancel') {
      try {
        let json = JSON.parse(body)

        time = time.filter(function (i) {
          return (i.time !== json.time) || (i.weekday !== json.weekday)
        })

        resp.writeHead(200)
        resp.end(JSON.stringify(time))
        conf.save(time)
      } catch (e) {
        process.stderr.write(e)
        resp.writeHead(404)
        resp.end()
      }
    }

  })

  if (req.url === '/') {
    resp.writeHead(200)
    resp.end(indexhtml)
  } else if (req.url === '/time') {
    resp.writeHead(200)
    resp.end(JSON.stringify(time))
  }

})

server.listen(8000);

const usr = ''
const pwd = ''

conf.read(function (data) {
  time = data
})

api.login(usr, pwd)

schedule.scheduleJob('0 0 * * * *', function () {
  api.login(usr, pwd)
})

schedule.scheduleJob('* * * * * *', function () {
  let start = Date.today().addDays(1).toFormat('YYYY-MM-DD')
  let end = Date.today().addDays(8).toFormat('YYYY-MM-DD')
  api.getTutorTime(start, end, function (list) {
    list.forEach(function (e) {
      let m = moment(e)
      let hm = m.format('HH:mm')
      let weekday = m.format('E')

      time.forEach(function (t) {
        if (t.time === hm && t.weekday == weekday) {
          debug(e)
          api.appoint(e, function (data) {
            debug(data)
          })
        }
      })
    })
  })
})
