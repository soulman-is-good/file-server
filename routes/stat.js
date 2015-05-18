"use strict";

var fs = require('fs'),
  mmm = require('mmmagic'),
  exec = require('child_process').exec,
  Magic = mmm.Magic;


function readFile(file, cb) {
  var filename = UPLOAD_DIR + "/" + file;

  fs.exists(filename, function (ex) {
    if (ex) {
      var magic = new Magic(mmm.MAGIC_MIME_TYPE);
      magic.detectFile(filename, function(err, result){
        if(err) {
          err.code = 500;
          cb(err)
        } else {
          var mimeType = result.split('/').shift();
          var stat = fs.statSync(filename);
          var data = {
            size: stat.size,
            name: file,
            mime: result
          };
          switch(mimeType) {
            case 'image':
              exec("identify " + filename, function(err, so){
                if(so && !err) {
                  var size = so.split(/[\s]/)[2];
                  if(size) {
                    size = size.split('x');
                    if(size.length === 2) {
                      data.width = parseInt(size[0]);
                      data.height = parseInt(size[1]);
                    }
                  }
                }
                cb(null, data);
              });
              break;
            default:
              cb(null, data);
          }
        }
      });
    } else {
      var err = new Error("No such file");
      err.code = 404;
      cb(err)
    }
  });
}

exports.get = function (req, res, next) {
  var file = req.params.file;
  readFile(file, function(err, data){
    if(err) {
      res.status(err.code || 500);
      res.json({name: file, error: err.message});
    } else {
      res.json(data);
    }
  });
};
exports.post = function(req, res, next){
  var Busboy = require('busboy');
  var MAX_FIELDS = process.env.FSRV_MAX_FIELDS || 100;
  var busboy = new Busboy({
    headers: req.headers,
    limits: {
      fields: MAX_FIELDS,
      fileFields: 1,
      fileSize: 1
    }
  });
  var files = [];
  var counter = 0;
  var I;
  function done() {
    if(counter === 0) {
      res.json(files);
    }
  }
  busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
    clearTimeout(I);
    counter++;
    if(fieldname === 'files') {
      readFile(val, function(err, data){
        if(err) {
          files.push({
            name: val,
            error: err.message
          });
        } else {
          files.push(data);
        }
        counter--;
        done();
      });
    } else {
      setTimeout(function(){counter--;done();}, 1000);
    }
  });
  I = setTimeout(function(){
    res.status(503);
    res.json({error: "Timeout"});
  }, 15000);
  busboy.on('error', function(err){
    clearTimeout(I);
    res.status(500);
    res.json({error: err.message});
  });
  req.pipe(busboy);
};
