const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require('./redis');
const slashes = require('connect-slashes');
const Helper = require('./helper');

const helper = Helper.getInstance();

module.exports = function(config) {

  config = config || {};

  redis.init(helper.getRedisConfig() || {});

  const app = express();

  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(bodyParser.json());

  app.set('views', path.join(__dirname, '../views/templates'));
  app.set('view engine', 'jade');

  let staticPath = '../public';
  if (config.development) {
    staticPath = '../public/dev';
  }

  // access log
  app.use((req, res, next) => {
    const allParams = req.query;
    Object.keys(req.body).forEach(key => {
      allParams[key] = req.body[key];
    });
    req.all = allParams;

    const startTime = Date.now();
    res.on('finish', () => {
      let duration = Date.now() - startTime;
      console.log('request to path [' + req.originalUrl + '] with params ' + JSON.stringify(req.all) + ' in ' + duration + ' milisecs');
    });

    next();
  });

  app.use('/static', express.static(path.join(__dirname, staticPath)));

  app.use(slashes());

  app.all('/', function(req, res) {
    let opts = {};
    Object.keys(req.all).forEach(key => {
      switch (key) {
        case 'server':
        case 'db':
          opts[key] = req.all[key];
          break;
        default:
          break;
      }
    });
    redis.init(helper.getRedisConfig(opts));
    res.render('index');
  });

  app.use('/db', function(req, res) {
    let opts = {};
    Object.keys(req.all).forEach(key => {
      switch (key) {
        case 'server':
        case 'db':
          opts[key] = req.all[key];
          break;
        default:
          break;
      }
    });
    redis.init(helper.getRedisConfig(opts));
    res.json({
      'status': 'OK'
    });
  });

  app.use('/state', function (req, res) {
    res.json({
      'status': 'OK',
      'servers':helper.getRedisServers(),
      'db': Array.apply(null, {length: 16}).map(Number.call, Number)
    });
  });

  app.use('/queue', require('./routes/queue'));
  app.use('/job', require('./routes/job'));

  app.use('*', function(req, res) {
    // Catch all
    res.sendStatus(404);
  });

  return app;

};
