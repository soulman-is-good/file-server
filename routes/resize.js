"use strict";

var imagic = require('../lib/imagic'),
  fs = require('fs');

exports.get = function (req, res, next) {
  var size = req.params.size;
  var file = req.params.file;
  console.log('Resizing', file, size, req.params);
  if (/^[0-9]{2,4}x[0-9]{2,4}/.test(size) && fs.existsSync(UPLOAD_DIR + "/" + file)) {
    var magic, filename;
    filename = UPLOAD_DIR + "/" + size;
    try {
      if (!fs.existsSync(filename)) {
        fs.mkdirSync(filename);
      }
      filename += "/" + file;
    } catch (e) {
      return next(e);
    } finally {
      if (fs.existsSync(filename)) {
        var stat = fs.statSync(filename);
        if (!req.headers['if-modified-since'] || new Date(req.headers['if-modified-since']).getTime() >= stat.mtime.getTime()) {
          console.log('reading from file');
          res.header("Cache-Control", "max-age=86400");
          res.header("Last-Modified", stat.mtime.toUTCString());
          fs.createReadStream(filename).pipe(res);
          return;
        }
      }
      size = size.split('x');
      var opts = {};
      var mod = size.length > 2 ? size.pop() : "s";
      var gravity = (parseInt(mod[1]) || 5) % 10;
      mod = mod[0];
      size = size.join('x');
      switch (mod) {
        case "s":
          mod = "shrink";
          break;
        case "i":
          mod = "ignore";
          break;
        case "f":
          mod = "fill";
          break;
        case "c":
          opts.crop = size;
          mod = "shrink";
          break;
        default:
          mod = "shrink";
      }
      switch (gravity) {
        case 1:
          gravity = "southwest";
          break;
        case 2:
          gravity = "south";
          break;
        case 3:
          gravity = "southeast";
          break;
        case 4:
          gravity = "west";
          break;
        case 5:
          gravity = "center";
          break;
        case 6:
          gravity = "east";
          break;
        case 7:
          gravity = "northwest";
          break;
        case 8:
          gravity = "north";
          break;
        case 9:
          gravity = "northeast";
          break;
        default:
          gravity = "center";
      }
      opts.resize = size;
      mod && (opts[mod] = true);
      opts.unsharp = '0x1';
      opts.support = '0.1';
      opts.gravity = gravity;
      magic = new imagic(UPLOAD_DIR + "/" + file);
      magic.resize(opts).save(filename, function (err) {
        if (err) {
          next(err);
        } else {
          res.header("Cache-Control", "max-age=86400");
          res.header("Last-Modified", new Date(Date.now() + 86400000).toUTCString());
          fs.createReadStream(filename).pipe(res);
        }
      });
    }
  } else {
    res.status(405);
    res.json({error: "Size or file not supported"});
  }
};