"use strict";

exports.get = function(req, res, next) {
  var w = parseInt(req.params.width);
  var h = parseInt(req.params.height);
  if(w % 16 !== 0 || h % 16 !== 0) {
    res.status(404);
    res.json({error: "Not found"});
  } else {
    //TODO: resize image and return
  }
};