const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const app = express();

app.use(bodyParser.json());

// If we require UUIDs
// https://github.com/broofa/node-uuid

app.post('/api/v1/events', function (req, res) {
  const payload = req.body;
  if (!payload.timestamp) {
    res.status(400).json('MISSING_TIMESTAMP');
    return;
  }
  const timestamp = moment(payload.timestamp);
  if (!timestamp || !timestamp.isValid()) {
    res.status(400).json('INVALID_TIMESTAMP');
    return;
  }
  if (!payload.type) {
    res.status(400).json('MISSING_TYPE');
    return;
  }
  if (payload.type !== 'gamma') {
    res.status(400).json('INVALID_TYPE');
    return;
  }
  // TODO Authenticate and get contributor id from database.
  const event = {
    timestamp: timestamp.utc().toISOString(),
    apiTimestamp: moment().utc().format(),
    type: payload.type
  };
  console.log(event);
  // TODO When we insert the data, check for collision:
  // only one event allowed per date and user.
  res.sendStatus(201);
});

app.listen(3000, function () {
  console.log('Gamma API listening on port 3000');
});
