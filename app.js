"use strict";

process.title = "file-srv";

var express = require('express'),
  app = express(),
  path = require('path'),
  fs = require('fs'),
  indexRoute = require('./routes/index'),
  urlRoute = require('./routes/url'),
  statRoute = require('./routes/stat'),
  resizeRoute = require('./routes/resize'),
  host = (process.env.FSRV_HOST || '0.0.0.0:7071').split(':'),
  port = parseInt(host[1]) || 7071,
  fileHelper = require('./lib/fileserver');

host = host[0] || '0.0.0.0';
/** Limit values **/
global.UPLOAD_DIR = process.env.FSRV_UPLOAD_DIR || path.join(__dirname, './uploads');

app.disable('x-powered-by');
//if server is key-secured - check to proceed
app.use(function(req, res, next){
  if(!process.env.FSRV_SECURITY_KEY || process.env.FSRV_SECURITY_KEY === req.headers['x-security-key']) {
    next();
  } else {
    res.status(403);
    res.end("Forbidden");
  }
});
app.use(fileHelper());

app.get('/', indexRoute.get);
app.post('/', indexRoute.post);
app.get('/:file', function(req, res){
  var filename = req.params.file;
  var file = UPLOAD_DIR + "/" + filename;
  fs.exists(file, function(is){
    if(is) {
      fs.createReadStream(file).pipe(res);
    } else {
      res.status(404);
      res.json({error: "Not found"});
    }
  });
});
app.get('/url/:url', urlRoute.get);
app.get('/stat/:file', statRoute.get);
app.post('/stat', statRoute.post);
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

var server = app.listen(port, host, function () {

  var address = server.address().address;
  var port = server.address().port;

  console.log('File server starts at %s:%s', address, port);

});
