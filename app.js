"use strict";

process.title = "file-srv";

/** Limit values **/
var MAX_FIELDS = process.env.FSRV_MAX_FIELDS || 100;
var MAX_FILES = process.env.FSRV_MAX_FILES || 100;
var MAX_FILE_SIZE = process.env.FSRV_MAX_FILE_SIZE || 50 * 1024 * 1024;
var UPLOAD_DIR = __dirname + '/uploads';

var http = require('http'),
  inspect = require('util').inspect,
  serveStatic = require('serve-static'),
  Busboy = require('busboy'),
  mmm = require('mmmagic'),
  Magic = mmm.Magic,
  crypto = require('crypto'),
  path = require('path'),
  fs = require('fs'),
  os = require('os');


function storeFile (stream, done) {
  var MimeType = null;
  var mimeDb = require('mime-db');
  var sha1 = crypto.createHash('sha1');
  var magic = new Magic(mmm.MAGIC_MIME_TYPE);
  var src = path.join(os.tmpDir(), Date.now().toString(36));
  var tmpFile = fs.createWriteStream(src);
  stream.on('data', function (data) {
    if (!tmpFile.write(data)) {
      tmpFile.once('drain', function () {
        stream.resume();
      });
      stream.pause();
    }
    sha1.update(data);
  });
  stream.on('end', function () {
    tmpFile.once('finish', function () {
      magic.detectFile(src, function (err, result) {
        if (err) {
          console.error("mmmagic detect", err.stack);
        } else {
          MimeType = result;
        }
        var ext = '.' + (((mimeDb[MimeType] && mimeDb[MimeType].extensions) || [])[0] || 'bin');
        var newfilename = sha1.digest('hex') + ext;
        var dest = path.join(UPLOAD_DIR, newfilename);
        if (fs.existsSync(dest)) {
          done(null, newfilename, MimeType);
        } else {
          fs.rename(src, dest, function (err) {
            done(err, newfilename, MimeType);
          });
        }
      });
    });
    tmpFile.end();
  });
}

function doneFileDownload (err, newfilename, MimeType) {
  var res = this;
  if (err) {
    console.error(err.stack);
    res.statusCode = 500;
    res.json({filename: newfilename, error: err.message});
  } else {
    res.json({filename: newfilename, mimetype: MimeType});
  }
}

var serve = serveStatic('uploads', {'index': false});

var server = http.createServer(function (req, res) {
  //json helper method
  res.json = function (obj) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  if (req.method === 'POST') {
    //File on a way
    var busboy = new Busboy({
      headers: req.headers,
      limits: {
        fields: MAX_FIELDS,
        fileFields: MAX_FILES,
        fileSize: MAX_FILE_SIZE
      }
    });
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      storeFile(file, doneFileDownload.bind(res));
    });
    req.pipe(busboy);
  } else if (req.method === 'GET') {
    if (req.url === "/") {
      //render upload form
      res.writeHead(200, {Connection: 'close'});
      res.end('<html><head></head><body>\
               <form method="POST" enctype="multipart/form-data">\
                <input type="text" name="textfield"><br />\
                <input type="file" name="filefield"><br />\
                <input type="submit">\
              </form>\
            </body></html>');
    } else if (/^\/url\//.test(req.url)) {
      var protocol = http;
      //Download file from url
      var url = req.url.match(/^\/url\/(.+)/);
      if (url) {
        url = url[1];
      }
      if (url) {
        url = decodeURIComponent(url);
        if (url.indexOf('https:') === 0) {
          protocol = require('https');
        }
      }
      var request = protocol.get(url, function (response) {
        storeFile(response, doneFileDownload.bind(res));
      });
      request.on('error', function (err) {
        console.error(err.stack);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.json({error: err.message});
        }
      });
      request.on('timeout', function () {
        res.statusCode = 408;
        res.json({error: "Request timeout"});
        request.abort();
      });
      request.setTimeout(15000);
    } else {
      serve(req, res, function (err) {
        if (err instanceof Error) {
          console.error(err.stack);
          res.statusCode = 500;
          res.json({error: err.message});
        } else if (!res.headersSent) {
          res.statusCode = 404;
          res.json({error: "Not found"});
        }
      });
    }
  } else {
    res.statusCode = 405;
    res.json({error: "Not implemented"});
  }
}).listen(7071, function () {
  var address = server.address().address;
  var port = server.address().port;
  console.log('File server starts at %s:%s', address, port);
});
