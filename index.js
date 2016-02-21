var google = require('googleapis');
var express = require('express');
var url = require('openurl');
var app = express();
var OAuth2 = google.auth.OAuth2;

const CLIENT_ID = "<input your client_id>";
const CLIENT_SECRET = "<input your client secret>";

const REDIRECT_PORT = "3000";
const REDIRECT_PATH = "/authresult";
const REDIRECT_URL = "http://localhost:" + REDIRECT_PORT + REDIRECT_PATH;

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
// set global authorization 
google.options({
    auth: oauth2Client
});

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/calendar'
];

var oauth_url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
    scope: scopes // If you only need one scope you can pass it as string
});

function getOauthResult(req, res) {
    if (req.query.error) {
        res.send('you should accept permission');
    } else {
        injectOauthToken(req.query.code);
        res.send('ok! please close window');
    }
}

function injectOauthToken(code) {
    oauth2Client.getToken(code, function (err, tokens) {
        // Now tokens contains an access_token and an optional refresh_token. Save them.
        if (!err) {
            oauth2Client.setCredentials(tokens);
            listEvents();
        }
    });
}

function listEvents() {
    var calendar = google.calendar('v3');
    calendar.events.list({
        calendarId: 'primary',
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
    }, function (err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var events = response.items;
        if (events.length == 0) {
            console.log('No upcoming events found.');
        } else {
            console.log('10 events:');
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                var start = event.start.dateTime || event.start.date;
                console.log('%s - %s', start, event.summary);
            }
            // exit node process
            process.exit();
        }
    });
}

app.get(REDIRECT_PATH, getOauthResult);

app.listen(REDIRECT_PORT, function () {
    url.open(oauth_url);
});