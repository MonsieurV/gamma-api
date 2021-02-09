'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var express = require('express');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth');
var MongoClient = require('mongodb').MongoClient;
var callbackToPromise = require('./utils').callbackToPromise;
var app = express();
var hashSha512 = require('./utils').hashSha512;

_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  var db;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return callbackToPromise(MongoClient.connect, 'mongodb://localhost:27017/gamma_api');

        case 2:
          db = _context.sent;

          console.log("Connected to MongoDb");

          // Allows to parse Json payloads.
          app.use(bodyParser.json());

          // If we require UUIDs
          // https://github.com/broofa/node-uuid

          require('./front')(app);
          require('./apiNoAuth')(app, db);

          // After here, all methods are authenticated.
          // Implement HTTP Basic Auth.
          app.use(function (req, res, next) {
            var credentials = basicAuth(req);
            if (!credentials) {
              res.setHeader('WWW-Authenticate', 'Basic realm="Gamma API Auth"');
              return res.status(401).json('Gamma API requires authentification');
            }
            db.collection('users').findOne({ email: credentials.name, password: hashSha512(credentials.pass) }, function (err, user) {
              if (err) {
                throw err;
              }
              if (!user) {
                res.statusCode = 403;
                res.setHeader('WWW-Authenticate', 'Basic realm="Gamma API Auth"');
                return res.status(403).json('Invalid credentials');
              }
              req.user = user;
              next();
            });
          });

          require('./apiAuth')(app, db);

          // TODO To get string param.
          // app.get('/user/:id', function(req, res) {
          //   res.send('user ' + req.params.id);
          // });

          app.listen(3000, function () {
            console.log('Gamma API listening on port 3000');
          });

          process.on('exit', function () {
            // Close db connection.
            console.log("Close connection to MongoDb");
            db.close();
          });

        case 11:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}))();
