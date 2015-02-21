"use strict";

exports.get = function (req, res, next) {
  var protocol = require('http');
  //Download file from url
  var url = req.params.url;

  if (url) {
    url = decodeURIComponent(url);
    console.log("Downloading from url: '" + url + "'");
    if (url.indexOf('https:') === 0) {
      protocol = require('https');
    }
  }
  var request = protocol.get(url, function (response) {
    req.storeFile(response, res.doneFileDownload.bind(res));
  });
  request.on('error', function (err) {
    next(err);
  });
  request.on('timeout', function () {
    var err = new Error("Request timeout");
    err.code = 408;
    next(err);
    request.abort();
  });
  request.setTimeout(15000);

};