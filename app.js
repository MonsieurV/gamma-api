const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const basicAuth = require('basic-auth');
const _ = require('lodash');
const MongoClient = require('mongodb').MongoClient;
const app = express();

// Connect to MongoDb instance.
var db;
MongoClient.connect('mongodb://localhost:27017/gamma_api', function(err, database) {
  if (err) {
    throw err;
  }
  console.log("Connected to MongoDb");
  db = database;
});

// Allows to parse Json payloads.
app.use(bodyParser.json());

// If we require UUIDs
// https://github.com/broofa/node-uuid

app.get('/', function (req, res) {
  res.redirect('https://github.com/MonsieurV/gamma-api');
});

// After here, all methods are authenticated.
// Implement HTTP Basic Auth.
const ADMINS = require('./admins');
app.use(function(req, res, next) {
  const credentials = basicAuth(req);
  if (!credentials) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Gamma API Auth"');
    return res.status(401).json('Gamma API requires authentification');
  }
  if (
    !ADMINS[credentials.name]
    || ADMINS[credentials.name].password !== credentials.pass
  ) {
    res.statusCode = 403;
    res.setHeader('WWW-Authenticate', 'Basic realm="Gamma API Auth"');
    return res.status(403).json('Invalid credentials');
  }
  next();
});

app.post('/api/v1/events', function (req, res) {
  const payload = req.body;
  if (!payload.timestamp) {
    return res.status(400).json('MISSING_TIMESTAMP');
  }
  const timestamp = moment(payload.timestamp);
  if (!timestamp || !timestamp.isValid()) {
    return res.status(400).json('INVALID_TIMESTAMP');
  }
  if (!payload.type) {
    return res.status(400).json('MISSING_TYPE');
  }
  if (payload.type !== 'gamma') {
    return res.status(400).json('INVALID_TYPE');
  }
  if (
    !payload.position
    || !'latitude' in payload.position
    || !'longitude' in payload.position
  ) {
    return res.status(400).json('MISSING_POSITION');
  }
  if (!payload.position.latitude) {
    return res.status(400).json('MISSING_LATITUDE');
  }
  if (!payload.position.longitude) {
    return res.status(400).json('MISSING_LONGITUDE');
  }
  if (
    !_.isNumber(payload.position.latitude)
    || payload.position.latitude < -90
    || payload.position.latitude > 90
  ) {
    return res.status(400).json('INVALID_LONGITUDE');
  }
  if (
    !_.isNumber(payload.position.longitude)
    || payload.position.longitude < -180
    || payload.position.longitude > 180
  ) {
    return res.status(400).json('INVALID_LATITUDE');
  }
  // TODO Authenticate and get contributor id from database.
  // TODO Add sensor id?
  const event = {
    timestamp: timestamp.utc().toISOString(),
    apiTimestamp: moment().utc().format(),
    type: payload.type,
    position: payload.position
  };
  console.log(event);
  // TODO When we insert the data, check for collision:
  // only one event allowed per date and user.
  res.sendStatus(201);
});

// TODO To get string param.
// app.get('/user/:id', function(req, res) {
//   res.send('user ' + req.params.id);
// });

app.listen(3000, function () {
  console.log('Gamma API listening on port 3000');
});

process.on('exit', function() {
  // Close db connection.
  console.log("Close connection to MongoDb");
  db.close();
});
