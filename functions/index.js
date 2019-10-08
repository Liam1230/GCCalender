const functions = require('firebase-functions');
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const cors = require('cors')({origin: true});
const OAuth2 = google.auth.OAuth2;
const calendar = google.calendar('v3');
const googleCredentials = require('./credentials.json');
const token = require('./token.json')
//const TOKEN_PATH = "./token.json"
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const ERROR_RESPONSE ={
    status:"500",
    message:"there was an error getting events from you Google calender"
}

exports.getCalenderEvents = functions.https.onRequest((request, response) =>{
    cors(request, response, () =>{
        const {client_secret, client_id, redirect_uris} = googleCredentials.installed;
        const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token)

        getEvents(oAuth2Client).then(data=>{
            response.status(200).send(data)
        }).catch(err=>{
            response.status(500).send(ERROR_RESPONSE)
        })
    })
})

function getEvents(auth){
    return new Promise ((resolve, reject)=>{
        console.log("called getEvents")
        
        calendar.events.list({
            auth: auth,
            calendarId: 'hakamii.acount@gmail.com',
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
            if (events.length) {
                resolve(events)
                // console.log('Upcoming 10 events:');
                // events.map((event, i) => {				
                //     const start = event.start.dateTime || event.start.date;
                //     console.log(`${start} - ${event.summary}`);
                //     console.log(event)
                //         // if(event.attendees){
                //         //     event.attendees.push({email:'hakamii.testuser1@gmail.com'})
                //         // }else{
                //         //     event.attendees = [{email:'hakamii.testuser1@gmail.com'}]
                //         // }
                //         // calendar.events.update({
                //         //     'calendarId': 'hakamii.acount@gmail.com',// デフォルトカレンダー：'primary'
                //         //     'eventId': 'rnfr47dpnv86oc6ffsd20qu4eg',
                //         //     'requestBody': event
                //         // })
                //         // .then(console.log)
                //         // .catch(console.error)
                // });
            } else {
                console.log('No upcoming events found.');
                reject('No upcoming events found.')
            }
        })
    })
}

