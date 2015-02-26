"use strict";

process.title = "file-srv";

var express = require('express'),
  app = express(),
  path = require('path'),
  serveStatic = require('serve-static'),
  indexRoute = require('./routes/index'),
  urlRoute = require('./routes/url'),
  resizeRoute = require('./routes/resize'),
  fileHelper = require('./lib/fileserver');

/** Limit values **/
global.UPLOAD_DIR = process.env.FSRV_UPLOAD_DIR || path.join(__dirname, './uploads');

app.disable('x-powered-by');
app.use(serveStatic('uploads', {'index': false}));
app.use(fileHelper());

app.get('/', indexRoute.get);
app.post('/', indexRoute.post);
app.get('/url/:url', urlRoute.get);
app.get('/:size/:file', resizeRoute.get);
//TODO: resizing app.get('/:width-:height/:modifier', resizeRoute.get);
app.all('*', function(req, res, next){
  res.status(404);
  res.json({error: "Not found"});
});
app.use(function (err, req, res, next) {
  if (err) {
    console.log(err.stack);
    if (!res.headersSent) {
      res.status(parseInt(err.code) || 500);
      res.json({error: err.message});
    }
  } else {
    res.statusCode = 405;
    res.json({error: "Not implemented"});
  }
  next();
});

var server = app.listen(7071, function () {

  var address = server.address().address;
  var port = server.address().port;

  console.log('File server starts at %s:%s', address, port);

});
