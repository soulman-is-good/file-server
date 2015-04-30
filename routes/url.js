"use strict";

exports.get = function (req, res, next) {
  var protocol = require('http');
  //Download file from url
  var url = req.params.url;

  var maxJumps = 10;
  function findFile (url) {
    if (url) {
      url = decodeURIComponent(url);
      console.log("Downloading from url: '" + url + "'");
      if (url.indexOf('https:') === 0) {
        protocol = require('https');
      }
    }
    if (url && maxJumps-- > 0) {
      var request = protocol.get(url, function (response) {
        if (response.statusCode >= 300 && response.statusCode < 400) {
          findFile(response.headers['location']);
          request.end();
        } else {
          req.storeFile(response, res.doneFileDownload.bind(res));
        }
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
    } else {
      res.json({error: maxJumps>0?'Wrong location':'Redirect limit reached'});
    }
  }
  findFile(url);
};