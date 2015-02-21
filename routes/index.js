"use strict";

var MAX_FIELDS = process.env.FSRV_MAX_FIELDS || 100;
var MAX_FILES = process.env.FSRV_MAX_FILES || 100;
var MAX_FILE_SIZE = process.env.FSRV_MAX_FILE_SIZE || 50 * 1024 * 1024;

var Busboy = require('busboy');


exports.get = function (req, res, next) {
  //render upload form
  res.writeHead(200, {Connection: 'close'});
  res.end('<html><head></head><body>\
               <form method="POST" enctype="multipart/form-data">\
                <input type="file" name="filefield"><br />\
                <input type="submit">\
              </form>\
            </body></html>');
};

exports.post = function (req, res, next) {
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
    req.storeFile(file, res.doneFileDownload.bind(res));
  });
  busboy.on('error', next);
  req.pipe(busboy);
};