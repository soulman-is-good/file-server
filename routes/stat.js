"use strict";

var fs = require('fs'),
  mmm = require('mmmagic'),
  exec = require('child_process').exec,
  Magic = mmm.Magic;


exports.get = function (req, res, next) {
  var file = req.params.file;
  var filename = UPLOAD_DIR + "/" + file;
  fs.exists(filename, function (ex) {
    if (ex) {
      var magic = new Magic(mmm.MAGIC_MIME_TYPE);
      magic.detectFile(filename, function(err, result){
        if(err) {
          res.status(500);
          res.json({error: err.message});
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
                res.json(data);
              });
              break;
            default:
              res.json(data);
          }
        }
      });
    } else {
      res.status(404);
      res.json({error: "No such file"});
    }
  });
};