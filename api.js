require('date-utils')
let moment = require('moment')
let schedule = require('node-schedule')
let request = require('request')
let req = request.defaults({jar: true})
let uid, coid

function debug(s) {
  process.stdout.write(moment().format('YYYY/MM/DD hh:mm:ss: ') + s + '\n')
}

function check(b, s) {
  if (!b) {
    process.stderr.write(s + '\n')
    process.exit(1)
  }
}

function login(usr, pwd, after_login_success) {
  req.post({
    url: 'http://www.acadsoc.com.cn/Ajax/Web.UI.Fun.User.aspx',
    form: {
      phone: '"' + usr +'"',
      password: '"' + pwd + '"',
      imageVerCode: '""',
      __: 'NewLogin'
  },}).on('data', function (data) {
    check (data.toString() === '1', 'login failed')

    // get uid
    req.get({
      url: 'http://www.acadsoc.com.cn/WebNew/user/BookClass/bookclass.aspx',
    }).on('data', function (data) {
      let r

      r = /UID: '(\d+)'/.exec(data)
      if (r === null)
        return
      uid = r[1]

      r = /COID: '(\d+)'/.exec(data)
      if (r === null)
        return
      coid = r[1]

      after_login_success()
    })
  })
}

function getTutorTime(start, end, callback) {
  let body = []
  req.post({
    url: 'http://www.acadsoc.com.cn/Ajax/Web.UI.Fun.Course.aspx',
    form: {
      // __=GetTutorTimeByIDS&uid=1533026&coid=884153&start=2018-07-30&end=2018-08-06
      __: 'GetTutorTimeByIDS',
      uid: uid,
      coid: coid,
      start: start,
      end: end,
    }
  }).on('data', function (data) {
    body.push(data)
  }).on('end', function () {
    body = Buffer.concat(body).toString()
    body = JSON.parse(body)

    let list = []
    for (let i in body.value) {
      let start = body.value[i].start
      start = start.replace('T', ' ')
      list.push(start)
    }
    callback(list)
  })
}

function appoint(start, callback) {
  req.post({
    url: 'http://www.acadsoc.com.cn/Ajax/Web.UI.Fun.Course.aspx',
    form: {
      COID: coid,
      start: '"' + start + '"',
      __: 'GetTutorByTime'
    }
  }).on('data', function (data) {
    // {"code":0,"msg":null,"value":[{"TUID":23831,"FullName":"Prin.cess","sex":0}]}
    data = JSON.parse(data)
    let tuid = data.value[0].TUID
    req.post({
      url: 'http://www.acadsoc.com.cn/Ajax/Web.UI.Fun.Course.aspx',
      form: {
        // TUID=23831&bookingWay=3&COID=884153&UID=1533026&targetTime=%222018-08-09+13%3A00%22&classtool=1&isNew=0&teacherPers=%22%22&teacherStyle=%22%22&__=AppointClass
        TUID: tuid,
        bookingWay: 3,
        COID: coid,
        UID: uid,
        targetTime: '"' + start + '"',
        classtool: 1,
        isNew: 0,
        teacherPers: '""',
        teacherStyle: '""',
        __: 'AppointClass'
      }
    }).on('data', function (data) {
      // {"code":0,"msg":null,"value":{"result":true,"msg":"恭喜您，您已成功预定！","data":{"action":{"name":"约课成功","action_id":1,"record_id":251897,"expires":"2018-08-02 16:53:59","total":1,"end":false},"qr":{"qr":"0bd301431ccb48718c8fb1217ce67398.jpg","url":"http://www.acadsoc.com.cn/share/AE561DCB23A2A507"}}}}
      callback(data)
    })
  })
}


let success_list = []
try {
  login('', '', function () {
    schedule.scheduleJob('* * * * * *', function () {
      let start = Date.today().addDays(1).toFormat('YYYY-MM-DD')
      let end = Date.today().addDays(8).toFormat('YYYY-MM-DD')
      getTutorTime(start, end, function (list) {
        for (let i in list) {
          if (success_list.continue(list[i]))
            continue
          debug(list[i])
          appoint(list[i], function (data) {
            debug(data)
            if (data.indexOf('成功') !== -1) {
              success_list.push(list[i])
            }
          })
        }
      })
    })
  })
} catch (e) {
  debug(e)
}



