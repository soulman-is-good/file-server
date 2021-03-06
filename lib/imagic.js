"use strict";

var spawn = require('child_process').spawn;

var IMagic = function (path) {

  var src_path = path;
  var dest_path = "";
  var settings = {};
  var processName = "convert";

  function _create (cb) {
    var params = _prepareParams() || [];
    if (params.length === 0) {
      cb();
    }
    params.unshift(src_path);
    params.push(dest_path);
    console.log(params);
    var instance = spawn(processName, params);
    instance.on('error', function (err) {
      cb(err);
    });
    instance.on('close', function (has_error) {
      if (!has_error) {
        cb();
      }
    });
  }

  function _prepareParams () {
    /**
     * {
     *  resize: '35x35',
     *  shrink: true, //>
     *  ignore: true, //!
     *  fill: true, //^
     *  crop: "21x21",
     *  gravity: "center"
     * }
     */
    var params = [];
    var modificator = settings.modify || (settings.shrink ? "shrink" : (settings.ignore ? "ignore" : settings.fill ? "fill" : ""));
    if (settings.resize) {
      var size = settings.resize;
      if (modificator === "shrink") {
        size += "\>";
      }
      if (modificator === "ignore") {
        size += "\!";
      }
      if (modificator === "fill") {
        size += "^";
      }
      params.push("-resize");
      params.push(size);
    }
    if (settings.gravity) {
      params.push("-gravity");
      params.push(settings.gravity);
    }
    if (settings.crop) {
      params.push("-extent");
      params.push(settings.crop);
    }
    for (var i in settings) {
      if (["shrink", "ignore", "fill", "resize", "crop", "gravity", "modify"].indexOf(i) === -1) {
        params.push('-' + i);
        params.push(settings[i]);
      }
    }
    return params;
  }
  this.resize = function (options) {
    settings = options || {};
    return this;
  };
  this.save = function (dest, callback) {
    dest_path = dest;
    _create(callback);
  };
};

module.exports = IMagic;