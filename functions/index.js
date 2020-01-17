const functions = require('firebase-functions');
const {google} = require('googleapis');
const cors = require('cors')({origin: true});
const OAuth2 = google.auth.OAuth2;
const calendar = google.calendar('v3');
const googleCredentials = require('./credentials.json');
const token = require('./token.json')
const CALENDER_ID = 'hakamii.acount@gmail.com'
const nodemailer = require('nodemailer');
//const TOKEN_PATH = "./token.json"
//const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// const ERROR_RESPONSE ={
//     status:"500",
//     message:"there was an error getting events from you Google calender"
//}


exports.getCalenderEvents = functions.https.onRequest((request, response) =>{
    cors(request, response, () =>{
        const {client_secret, client_id, redirect_uris} = googleCredentials.installed;
        const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token)

        new function(auth){
            return new Promise ((resolve, reject)=>{
                console.log("called getEvents")
                
                calendar.events.list({
                    auth: auth,
                    calendarId: CALENDER_ID,
                    timeMin: (new Date()).toISOString(),
                    maxResults: 10,
                    singleEvents: true,
                    orderBy: 'startTime',
                }, (err, res) => {
                    if (err){
                        console.log('The API returned an error: ' + err);
                        reject(err);
                    } 
                    const events = res.data.items;
                
                    resolve(events)
                })
            })
        }(oAuth2Client).then(data=>{
            response.status(200).send(data)
        }).catch(err=>{
            response.status(500).send(err)
        })
    })
})

exports.addEventAttendees = functions.https.onRequest((request, response) =>{
    cors(request, response, () =>{
        const {client_secret, client_id, redirect_uris} = googleCredentials.installed;
        const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token)

        const event = request.body.event
        const attendees = request.body.attendees

        new function(auth){
            return new Promise ((resolve, reject)=>{
                if(event.attendees){
                    event.attendees.push({email:attendees})
                }else{
                    event.attendees = [{email:attendees}]
                }
                calendar.events.update({
                    auth: auth,
                    'calendarId': CALENDER_ID,
                    'eventId': event.id,
                    'requestBody': event
                }, (err, res) => {
                    if (err){
                        console.log('The API returned an error: ' + err);
                        reject(err);
                    } 
                    console.log("addEvent Success: "+attendees)
                    resolve(res)
                })
            })
        }(oAuth2Client).then(data=>{
            response.status(200).send(data)
        }).catch(err=>{
            response.status(500).send(err)
        })
    })
})

exports.onRequestClass = functions.https.onRequest((request, response) =>{  
    cors(request, response, () =>{
        //メール送る
        const body = request.body;
        const date = body.date;
        const time = body.time.replace('〜','~');
        const location = body.location
        const auther = body.auther;

        //本文に日付、時間、リクエスト者をパラメータに追加したURLを記載しておく
        var smtpConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // SSL
            auth: {
                user: 'kinoko.sd@gmail.com',
                pass: 'kin0k0data'
            }
        };

        var template = `
授業のリクエストがありました。
リクエストの内容
${date} ${time}
${auther}

承認する場合は以下のURLをクリック
https://us-central1-garagecampus-dd3ca.cloudfunctions.net/addEventToCalender/?date=${date}&time=${time}&auther=${auther}&location=${location}


拒否する場合は以下のURLをクリック
https://us-central1-garagecampus-dd3ca.cloudfunctions.net/rejectRequest/?date=${date}&time=${time}&auther=${auther}&location=${location}
`

        // メッセージ
        var message = {
            from    : 'kinoko.sd@gmail.com',
            to      : 'kinoko.sd@gmail.com',
            subject : `授業のリクエスト`,
            text    : template,
        };

        var transporter = nodemailer.createTransport(smtpConfig);
        transporter.sendMail(message, function(err, res) {
            response.send(err || res);
        });
    })
})
exports.rejectRequest = functions.https.onRequest((request, response) =>{  
    cors(request, response, () =>{
        //イベントの追加
        //パラメータ 日付　時間　投稿者
        const body = request.query;
        const date = body.date;
        const time = body.time;
        const auther = body.auther;
        const location = body.location;

        var smtpConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // SSL
            auth: {
                user: 'kinoko.sd@gmail.com',
                pass: 'kin0k0data'
            }
        };
        
        var template = `
リクエストが拒否されました。

申し訳ありませんが、都合が合わなかったため授業のリクエストが拒否されました。
もう一度別の日程にリクエストをお願いします。

リクエストの内容
${date} ${time} ${location}
${auther}
`
        // メッセージ
        var message = {
            from    : 'kinoko.sd@gmail.com',
            to      : auther,
            subject : `リクエストキャンセルのお知らせ`,
            text    : template,
        };

        var transporter = nodemailer.createTransport(smtpConfig);
        transporter.sendMail(message, function(err, res) {
            response.send(err || res);
        });
    })
})
exports.addEventToCalender = functions.https.onRequest((request, response) =>{  
    cors(request, response, () =>{
        //イベントの追加
        //パラメータ 日付　時間　投稿者
        const body = request.query;
        const date = body.date;
        const time = body.time;
        const auther = body.auther;
        const location = body.location;

        const {client_secret, client_id, redirect_uris} = googleCredentials.installed;
        const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token)

        let startTime = '';
        let endTime = '';
        if(time == '13:00~16:00'){
            startTime = 'T13:00:00.000+09:00';
            endTime = 'T16:00:00.000+09:00';
        }else if(time == '16:00~19:00'){
            startTime = 'T16:00:00.000+09:00';
            endTime = 'T19:00:00.000+09:00';
        }else if(time == '19:00~21:30'){
            startTime = 'T19:00:00.000+09:00';
            endTime = 'T21:30:00.000+09:00';
        }

        new function(auth){
            return new Promise ((resolve, reject)=>{
                calendar.events.insert({
                    auth: auth,
                    calendarId: CALENDER_ID,
                    resource:{
                        summary: '授業', // 予定のタイトル
                        start: { // 開始日・時刻
                            dateTime: date+startTime
                        },
                        end: { // 終了日・時刻
                            dateTime: date+endTime
                        },
                        location: location, // 場所
                        attendees: [{
                            email: auther
                        }]
                    }
                }, (err, res) => {
                    if (err){
                        console.log('The API returned an error: ' + err);
                        reject(err);
                    } 
                    console.log("addEvent Success "+ res)
                    resolve(res)
                })
            })
        }(oAuth2Client).then(data=>{
            //本文に日付、時間、リクエスト者をパラメータに追加したURLを記載しておく
            var smtpConfig = {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // SSL
                auth: {
                    user: 'kinoko.sd@gmail.com',
                    pass: 'kin0k0data'
                }
            };

            var template = `
授業のリクエストが承認されました。
リクエストの内容
${date} ${time} ${location}
${auther}
`
            // メッセージ
            var message = {
                from    : 'kinoko.sd@gmail.com',
                to      : auther,
                subject : `授業の成立のお知らせ`,
                text    : template,
            };

            var transporter = nodemailer.createTransport(smtpConfig);
            transporter.sendMail(message, function(err, res) {
                response.send(err || res);
            });
        }).catch(err=>{
            response.status(500).send(err)
        })
    })
})
