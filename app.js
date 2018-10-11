'use strict';

const express = require('express');
express.static.mime.charsets.lookup=function(){}
const compression = require('compression');
const cluster = require('cluster');
const app = express();
const numCPUs = require('os').cpus().length;

app.use(compression());

app.set('x-powered-by', false)

if (cluster.isMaster && !module.parent) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
    
    console.info("cors-container listening on port 3000 with " + numCPUs + " threads.")
} else {
    if (!module.parent) {
        app.listen(process.env.PORT || 3000);
    }
}

require(__dirname + '/bootstrap')(app);

module.exports = app;
