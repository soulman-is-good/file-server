"use strict";

process.title = "file-clus";

var cluster = require('cluster');
var os = require('os');

cluster.setupMaster(
  {
    exec: __dirname + '/app.js'
  }
);

for (var i = 0; i < os.cpus().length; i++) {
  cluster.fork();
}

cluster.on('exit', function (worker, code, signal) {
  console.log('worker ' + worker.process.pid + ' died with code ', code, 'signal', signal);
  cluster.fork();
});
