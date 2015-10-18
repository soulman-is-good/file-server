"use strict";

var MAX_FIELDS = parseInt(process.env.FSRV_MAX_FIELDS) || 100;
var MAX_FILES = parseInt(process.env.FSRV_MAX_FILES) || 100;
var MAX_FILE_SIZE = parseInt(process.env.FSRV_MAX_FILE_SIZE) || 50 * 1024 * 1024;
var FREESPACE_LIMIT = (parseInt(process.env.FSRV_FREESPACE_LIMIT) || 50) * 1024 * 1024 * 1024;

var Busboy = require('busboy');
var freespace = require('../lib/freespace');


exports.get = function (req, res, next) {
  //render upload form
  res.writeHead(200, {Connection: 'close'});
  res.end('<html><head></head><body>\
               <form method="POST" enctype="multipart/form-data">\
                <input type="file" name="filefield"><br />\
                <input type="file" name="filefield"><br />\
                <input type="file" name="filefield"><br />\
                <input type="file" name="filefield"><br />\
                <input type="submit">\
              </form>\
            </body></html>');
};

exports.post = function (req, res, next) {
  //File on a way
  var busboy, files, counter;
  freespace(function (err, avail) {
    if (err) {
      console.error(err.message);
      console.error(err.stack);
      res.status(500);
      res.json({error: err.message});
    } else if (avail < FREESPACE_LIMIT) {
      console.error("Can't store file, only " + avail + " bytes are available, limit is " + FREESPACE_LIMIT + " bytes");
      res.status(500);
      res.json({error: "Out of free space"});
    } else {
      busboy = new Busboy({
        headers: req.headers,
        limits: {
          fields: MAX_FIELDS,
          fileFields: MAX_FILES,
          fileSize: MAX_FILE_SIZE
        }
      });
      files = [];
      counter = 0;
      busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        if (filename) {
          counter++;
          req.storeFile(file, function (err, filename, mime) {
            counter--;
            var json = {filename: filename, mimetype: mime};
            if (err) {
              console.error(err.message);
              console.error(err.stack);
              json.error = err.message;
            }
            files.push(json);
            if (counter === 0) {
              if(req.xhr) {
                res.json(files.length > 1 ? files : files.pop());
              } else {
                res.write('<html><head></head><body><form method="POST" enctype="multipart/form-data">\
                 <input type="file" name="filefield"><br />\
                 <input type="file" name="filefield"><br />\
                 <input type="file" name="filefield"><br />\
                 <input type="file" name="filefield"><br />\
                 <input type="submit">\
               </form><hr/>');
                for(var i in files) {
                  res.write('<input readonly="true" style="width:100%" onclick="select()" type="text" value="http://fs.backpack.kz/800x1000/'+files[i].filename+'" /><br/>');
                  res.write('<img alt="image" src="http://fs.backpack.kz/800x1000/'+files[i].filename+'" /><hr/>');
                }
                res.end('</body></html>');
              }
            }
          });
        }
      });
      busboy.on('error', next);
      req.pipe(busboy);
    }
  });
};
