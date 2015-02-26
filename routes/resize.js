"use strict";

var imagic = require('../lib/imagic'),
  fs = require('fs');

exports.get = function (req, res, next) {
  var size = req.params.size;
  var file = req.params.file;
  console.log('Resizing', file, size, req.params);
  if (/^[0-9]{2,4}x[0-9]{2,4}/.test(size) && file) {
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
      size = size.split('x');
      var opts = {};
      var mod = size.length > 2 ? size.pop() : "s";
      var gravity = (parseInt(mod[1]) || 5) % 10;
      mod = mod[0];
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
          opts.crop = true;
          mod = "crop";
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
      size = size.join('x');
      opts.resize = size;
      opts[mod] = true;
      magic = new imagic(UPLOAD_DIR + "/" + file);
      magic.resize(opts).save(filename, function (err) {
        if (err) {
          next(err);
        } else {
          fs.createReadStream(filename).pipe(res);
        }
      });
    }
  } else {
    res.status(405);
    res.json({error: "Size not supported"});
  }
};