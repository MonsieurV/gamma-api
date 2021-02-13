const _ = require("lodash");
const moment = require("moment");
const { validateEmail } = require("./utils");
const { hashSha512 } = require("./utils");
const { ObjectId } = require("mongodb");

module.exports = (app, db) => {
  app.get("/api/v1/events", async function (req, res) {
    if (!req.user.isAdmin) {
      return res.sendStatus(403);
    }
    // TODO use .skip() for pagination.
    // TODO Allows to get data from all users.
    // TODO Load user and sensor data.
    const events = await db.collection("events").find({}).limit(200).toArray();
    res.status(200).json(
      events.map((event) => {
        return {
          type: event.type,
          position: event.position,
          timestamp: event.timestamp,
          api_timestamp: event.api_timestamp,
          user: event.user,
          deviceId: event.deviceId,
        };
      })
    );
  });

  app.get("/api/v1/me/events", async function (req, res) {
    // TODO use .skip() for pagination.
    // TODO Load user and sensor data.
    const events = await db
      .collection("events")
      .find({
        user: req.user.email,
      })
      .limit(200)
      .toArray();
    res.status(200).json(
      events.map((event) => {
        return {
          type: event.type,
          position: event.position,
          timestamp: event.timestamp,
          api_timestamp: event.api_timestamp,
          user: {
            email: req.user.email,
          },
          deviceId: event.deviceId,
        };
      })
    );
  });

  app.post("/api/v1/events", async function (req, res) {
    if (!req.body.timestamp) {
      return res.status(400).json("MISSING_TIMESTAMP");
    }
    const timestamp = moment(req.body.timestamp);
    if (!timestamp || !timestamp.isValid()) {
      return res.status(400).json("INVALID_TIMESTAMP");
    }
    if (!req.body.type) {
      return res.status(400).json("MISSING_TYPE");
    }
    if (req.body.type !== "gamma") {
      return res.status(400).json("INVALID_TYPE");
    }
    if (!req.body.deviceId) {
      return res.status(400).json("MISSING_DEVICE_ID");
    }
    const device = await db
      .collection("devices")
      .findOne({ user: req.user.email, _id: new ObjectId(req.body.deviceId) });
    if (!device) {
      return res.status(400).json("DEVICE_NOT_FOUND");
    }
    const event = {
      timestamp: timestamp.utc().toISOString(),
      api_timestamp: moment().utc().format(),
      type: req.body.type,
      user: req.user.email,
      deviceId: req.body.deviceId,
    };
    // When we insert the data, check for collision:
    // only one event allowed per date and user.
    const eventFromDb = await db.collection("events").findOne({
      type: event.type,
      timestamp: event.timestamp,
      user: req.user.email,
      deviceId: req.body.deviceId,
    });
    if (eventFromDb) {
      return res.status(400).json("ALREADY_PUBLISHED");
    }
    // TODO Check return insert.
    db.collection("events").insertOne(event);
    res.sendStatus(201);
  });

  app.get("/api/v1/me", async function (req, res) {
    // TODO Return counts of events, total, by devices, etc.
    const devices = await db
      .collection("devices")
      .find({
        user: req.user.email,
      })
      .limit(200)
      .toArray();
    res.status(200).json({
      email: req.user.email,
      devices: devices,
    });
  });

  app.post("/api/v1/users", async function (req, res) {
    if (!req.user.isAdmin) {
      return res.sendStatus(403);
    }
    if (!req.body.email) {
      return res.status(400).json("MISSING_EMAIL");
    }
    if (!validateEmail(req.body.email)) {
      return res.status(400).json("INVALID_EMAIL");
    }
    if (!req.body.password) {
      return res.status(400).json("MISSING_PASSWORD");
    }
    if (!_.isString(req.body.password) || req.body.password.length < 10) {
      return res.status(400).json("INVALID_PASSWORD");
    }
    if (req.body.isAdmin) {
      if (!_.isBoolean(req.body.isAdmin)) {
        return res.status(400).json("INVALID_IS_ADMIN");
      }
    } else {
      req.body.isAdmin = false;
    }
    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json("EMAIL_ALREADY_REGISTERED");
    }
    await db.collection("users").insertOne({
      email: req.body.email,
      password: hashSha512(req.body.password),
      isAdmin: req.body.isAdmin,
    });
    res.sendStatus(201);
  });

  app.patch("/api/v1/users/:email", async function (req, res) {
    const patch = {};
    if (!req.user.isAdmin && req.user.email !== req.params.email) {
      return res.sendStatus(403);
    }
    if (!req.params.email) {
      return res.status(400).json("MISSING_EMAIL");
    }
    if (req.body.email) {
      return res.status(400).json("CAN_NOT_CHANGE_EMAIL");
    }
    if (req.body.hasOwnProperty("password")) {
      if (!_.isString(req.body.password) || req.body.password.length < 10) {
        return res.status(400).json("INVALID_PASSWORD");
      }
      patch.password = hashSha512(req.body.password);
    }
    if (req.body.hasOwnProperty("isAdmin")) {
      if (!req.user.isAdmin) {
        return res.sendStatus(403);
      }
      if (!_.isBoolean(req.body.isAdmin)) {
        return res.status(400).json("INVALID_IS_ADMIN");
      }
      patch.isAdmin = req.body.isAdmin;
    }
    const result = await db.collection("users").updateOne(
      { email: req.params.email },
      {
        $set: patch,
      }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json("USER_NOT_FOUND");
    }
    res.sendStatus(204);
  });

  app.delete("/api/v1/users/:email", async function (req, res) {
    if (!req.user.isAdmin) {
      return res.sendStatus(403);
    }
    if (!req.params.email) {
      return res.status(400).json("MISSING_EMAIL");
    }
    const result = await db
      .collection("users")
      .deleteOne({ email: req.params.email });
    if (result.deletedCount === 0) {
      return res.status(404).json("USER_NOT_FOUND");
    }
    // TODO Delete also all devices? events?
    // Or just tag the user as deleted and keep the data? (soft delete)
    res.sendStatus(204);
  });

  app.get("/api/v1/devices", async function (req, res) {
    if (!req.user.isAdmin) {
      return res.sendStatus(403);
    }
    // TODO use .skip() for pagination.
    // TODO Load user and sensor data.
    const devices = await db
      .collection("devices")
      .find({})
      .limit(200)
      .toArray();
    res.status(200).json(devices.map((device) => device));
  });

  app.post("/api/v1/devices", async function (req, res) {
    if (!req.body.manufacturer) {
      return res.status(400).json("MISSING_MANUFACTURER");
    }
    if (!req.body.model) {
      return res.status(400).json("MISSING_MODEL");
    }
    if (!req.body.sensor) {
      return res.status(400).json("MISSING_SENSOR");
    }
    if (
      !req.body.position ||
      !"name" in req.body.position ||
      !"latitude" in req.body.position ||
      !"longitude" in req.body.position
    ) {
      return res.status(400).json("MISSING_POSITION");
    }
    if (!req.body.position.name) {
      return res.status(400).json("MISSING_POSITION_NAME");
    }
    if (!req.body.position.latitude) {
      return res.status(400).json("MISSING_LATITUDE");
    }
    if (!req.body.position.longitude) {
      return res.status(400).json("MISSING_LONGITUDE");
    }
    if (
      !_.isNumber(req.body.position.latitude) ||
      req.body.position.latitude < -90 ||
      req.body.position.latitude > 90
    ) {
      return res.status(400).json("INVALID_LONGITUDE");
    }
    if (
      !_.isNumber(req.body.position.longitude) ||
      req.body.position.longitude < -180 ||
      req.body.position.longitude > 180
    ) {
      return res.status(400).json("INVALID_LATITUDE");
    }
    // TODO Generate user friendly device id.
    // https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
    const device = {
      manufacturer: req.body.manufacturer,
      model: req.body.model,
      sensor: req.body.sensor,
      position: req.body.position,
      user: req.user.email,
    };
    // When we insert the data, check for collision.
    const deviceFromDb = await db.collection("devices").findOne(device);
    // Already return device to allows for call before each publication session,
    // without having to GET the list of devices.
    if (deviceFromDb) {
      return res.status(200).json(deviceFromDb);
    }
    // TODO Check return insert.
    const result = await db.collection("devices").insertOne(device);
    device["_id"] = result.insertedId.toString();
    // Return so user get the id.
    res.status(201).json(device);
  });

  app.delete("/api/v1/devices/:id", async function (req, res) {
    // TODO Do not authorize if published data for the device?
    // Or add device on the events directly (will renerage bunch of data!)
    // Or soft delete?
    if (!req.user.isAdmin) {
      return res.sendStatus(403);
    }
    if (!req.params.id) {
      return res.status(400).json("MISSING_ID");
    }
    const result = await db
      .collection("devices")
      .deleteOne({ user: req.user.email, _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json("DEVICE_NOT_FOUND");
    }
    res.sendStatus(204);
  });
};
