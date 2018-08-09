let http = require('http')
let fs = require('fs')
let api = require('./api.js')
let schedule = require('node-schedule')
let moment = require('moment')
let conf = require('./conf.js')
const log = require('./log.js')
require('date-utils')
let indexhtml
let time
let appoint_list = []

process.on('uncaughtException', function (e) {
  log.d(e)
});

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

let usr = ''
let pwd = ''

conf.read_account(function (a, b) {
  usr = a
  pwd = b
  api.login(usr, pwd)
})

conf.read(function (data) {
  time = data
})


schedule.scheduleJob('0 0 0 * * *', function () {
  api.login(usr, pwd)

  appoint_list = appoint_list.filter(function (v) {
    return moment(v) >= moment.now()
  })
})

schedule.scheduleJob('*/3 * 9-22 * * *', function () {
  let start = Date.today().addDays(1).toFormat('YYYY-MM-DD')
  let end = Date.today().addDays(31).toFormat('YYYY-MM-DD')
  api.getTutorTime(start, end, function (list) {
    list.forEach(function (e) {
      if (appoint_list.includes(e))
        return
      let m = moment(e)
      let hm = m.format('HH:mm')
      let weekday = m.format('E')

      time.forEach(function (t) {
        if (t.time === hm && t.weekday == weekday) {
          log.d(e)
          api.appoint(e, function (data) {
            log.d(data)
            if (data.indexOf('成功') > -1) {
              appoint_list.push(e)
            }
          })
        }
      })
    })
  })
})
