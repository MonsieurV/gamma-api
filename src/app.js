const process = require("process");
const express = require("express");
const bodyParser = require("body-parser");
const basicAuth = require("basic-auth");
const { MongoClient } = require("mongodb");
const app = express();
const { hashSha512 } = require("./utils");

const DEFAULT_MONGO_DB_URI = "mongodb://admin:adminpw@localhost:27017/gamma_api?authSource=admin";

(async function () {
  // Connect to MongoDb instance.
  if (!process.env.MONGO_DB_URI) {
    console.warn(
      `No env MONGO_DB_URI defined; defaulting to ${DEFAULT_MONGO_DB_URI}`
    );
  }
  const uri = process.env.MONGO_DB_URI || DEFAULT_MONGO_DB_URI;
  const client = MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  console.log("Connected to MongoDb");
  await client.db("gamma_api").command({ ping: 1 });
  const db = client.db("gamma_api");

  // Allows to parse Json payloads.
  app.use(bodyParser.json());

  // If we require UUIDs
  // https://github.com/broofa/node-uuid

  require("./front")(app);
  require("./apiNoAuth")(app, db);

  // After here, all methods are authenticated.
  // Implement HTTP Basic Auth.
  app.use(async function (req, res, next) {
    const credentials = basicAuth(req);
    if (!credentials) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Gamma API Auth"');
      return res.status(401).json("Gamma API requires authentification");
    }
    const user = await db.collection("users").findOne({
      email: credentials.name,
      password: hashSha512(credentials.pass),
    });
    if (!user) {
      res.setHeader("WWW-Authenticate", 'Basic realm="Gamma API Auth"');
      return res.status(401).json("Invalid credentials");
    }
    req.user = user;
    next();
  });

  require("./apiAuth")(app, db);

  // TODO To get string param.
  // app.get('/user/:id', function(req, res) {
  //   res.send('user ' + req.params.id);
  // });

  app.listen(3000, function () {
    console.log("Gamma API listening on port 3000");
  });

  process.on("exit", function () {
    // Close db connection.
    console.log("Close connection to MongoDb");
    db.close();
  });
})();
