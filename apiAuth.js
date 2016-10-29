const _ = require('lodash');
const moment = require('moment');

module.exports = (app, db) => {
  app.get('/api/v1/events', function (req, res) {
    // TODO use .skip() for pagination.
    db.collection('events').find().limit(200).toArray((err, events) => {
      if (err) {
        throw err;
      }
      res.status(200).json(events.map((event) => {
        return {
          type: event.type,
          position: event.position,
          timestamp: event.timestamp,
          api_timestamp: event.api_timestamp
        }
      }));
    });
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
      api_timestamp: moment().utc().format(),
      type: payload.type,
      position: payload.position
    };
    // When we insert the data, check for collision:
    // only one event allowed per date and user.
    db.collection('events').findOne({
      timestamp: event.timestamp, type: event.type,
      position: event.position }, (err, eventFromDb) => {
        if (err) {
          throw err;
        }
        if (eventFromDb) {
          return res.status(400).json('ALREADY_PUBLISHED');
        }
        db.collection('events').insert(event);
        res.sendStatus(201);
      });
  });
}
