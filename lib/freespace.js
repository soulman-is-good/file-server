"use strict";

var exec = require('child_process').exec;

module.exports = function(cb){
  exec("df -B 1 | head -2 | tail -1", function(err, out, se) {
    if(err) {
      cb(err);
    } else {
      var params = out.replace(/\s+/g,' ').split(' ');
      var avail = parseInt(params[3]);
      if(isNaN(avail)) {
        cb(new Error("Can't find free space"));
      } else {
        cb(null, avail);
      }
    }
  });
};