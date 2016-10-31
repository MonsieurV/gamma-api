const _ = require('lodash');
const moment = require('moment');
const validateEmail = require('./utils').validateEmail;
const hashSha512 = require('./utils').hashSha512;

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
    if (!req.body.timestamp) {
      return res.status(400).json('MISSING_TIMESTAMP');
    }
    const timestamp = moment(req.body.timestamp);
    if (!timestamp || !timestamp.isValid()) {
      return res.status(400).json('INVALID_TIMESTAMP');
    }
    if (!req.body.type) {
      return res.status(400).json('MISSING_TYPE');
    }
    if (req.body.type !== 'gamma') {
      return res.status(400).json('INVALID_TYPE');
    }
    if (
      !req.body.position
      || !'latitude' in req.body.position
      || !'longitude' in req.body.position
    ) {
      return res.status(400).json('MISSING_POSITION');
    }
    if (!req.body.position.latitude) {
      return res.status(400).json('MISSING_LATITUDE');
    }
    if (!req.body.position.longitude) {
      return res.status(400).json('MISSING_LONGITUDE');
    }
    if (
      !_.isNumber(req.body.position.latitude)
      || req.body.position.latitude < -90
      || req.body.position.latitude > 90
    ) {
      return res.status(400).json('INVALID_LONGITUDE');
    }
    if (
      !_.isNumber(req.body.position.longitude)
      || req.body.position.longitude < -180
      || req.body.position.longitude > 180
    ) {
      return res.status(400).json('INVALID_LATITUDE');
    }
    // TODO Authenticate and get contributor id from database.
    // TODO Add sensor id?
    const event = {
      timestamp: timestamp.utc().toISOString(),
      api_timestamp: moment().utc().format(),
      type: req.body.type,
      position: req.body.position
    };
    // When we insert the data, check for collision:
    // only one event allowed per date and user.
    db.collection('events').findOne(
      {
        timestamp: event.timestamp, type: event.type,
        position: event.position
      },
      (err, eventFromDb) => {
        if (err) {
          throw err;
        }
        if (eventFromDb) {
          return res.status(400).json('ALREADY_PUBLISHED');
        }
        // TODO Check return insert.
        db.collection('events').insert(event);
        res.sendStatus(201);
      });
  });

  app.post('/api/v1/users', function (req, res) {
    if (!req.user.isAdmin) {
      return res.sendStatus(403);
    }
    if (!req.body.email) {
      return res.status(400).json('MISSING_EMAIL');
    }
    if (!validateEmail(req.body.email)) {
      return res.status(400).json('INVALID_EMAIL');
    }
    if (!req.body.password) {
      return res.status(400).json('MISSING_PASSWORD');
    }
    if (!_.isString(req.body.password) || req.body.password.length < 10) {
      return res.status(400).json('INVALID_PASSWORD');
    }
    if (req.body.isAdmin) {
      if (!_.isBoolean(req.body.isAdmin)) {
        return res.status(400).json('INVALID_IS_ADMIN');
      }
    } else {
      req.body.isAdmin = false;
    }
    db.collection('users').findOne({ email: req.body.email }, (err, user) => {
      if (err) {
        throw err;
      }
      if (user) {
        return res.status(400).json('EMAIL_ALREADY_REGISTERED');
      }
      db.collection('users').insert({
        email: req.body.email,
        password: hashSha512(req.body.password),
        isAdmin: req.body.isAdmin
      });
      res.sendStatus(201);
    });
  });

  app.put('/api/v1/users/:email', function (req, res) {
    if (!req.user.isAdmin) {
      return res.status(403);
    }
    if (!req.params.email) {
      return res.status(400).json('MISSING_EMAIL');
    }
    if (req.body.email) {
      return res.status(400).json('CAN_NOT_CHANGE_EMAIL');
    }
    if (!req.body.password) {
      return res.status(400).json('MISSING_PASSWORD');
    }
    if (!_.isString(req.body.password) || req.body.password.length < 10) {
      return res.status(400).json('INVALID_PASSWORD');
    }
    if (req.body.isAdmin) {
      if (!_.isBoolean(req.body.isAdmin)) {
        return res.status(400).json('INVALID_IS_ADMIN');
      }
    } else {
      req.body.isAdmin = false;
    }
    db.collection('users').update(
      { email: req.params.email },
      { $set: {
        password: hashSha512(req.body.password),
        isAdmin: req.body.isAdmin
      } },
      (err, result) => {
        if (err) {
          throw err;
        }
        if (result.result.n === 0) {
          return res.status(404).json('USER_NOT_FOUND');
        }
        res.sendStatus(204);
    });
  });

  app.delete('/api/v1/users/:email', function (req, res) {
    if (!req.user.isAdmin) {
      return res.status(403);
    }
    if (!req.params.email) {
      return res.status(400).json('MISSING_EMAIL');
    }
    db.collection('users').remove(
      { email: req.params.email },
      { justOne: true },
      (err, result) => {
        if (err) {
          throw err;
        }
        if (result.result.n === 0) {
          return res.status(404).json('USER_NOT_FOUND');
        }
        res.sendStatus(204);
    });
  });
}
