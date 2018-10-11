'use strict';

const express = require('express');
const request = require('request-promise');
const converter = require('rel-to-abs');
const url = require('url');
const fs = require('fs');
const index = fs.readFileSync('index.html', 'utf8');
const ResponseBuilder = require('./app/ResponseBuilder');
const Iconv = require('iconv').Iconv;
var iconv  = require('iconv-lite');
const Buffer = require('buffer').Buffer;

const debug = process.env.debug_log || false;

module.exports = function(app){
    function setHeaders(res, origin){
        if(debug) {
            console.info("setHeaders origin:" , JSON.stringify(origin.headers));  
        } 
        res.header(origin.headers);
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', false);
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('X-Proxied-By', 'cors-container');
    }

    app.get('/*', (req, res) => {

        console.log(res.body)
        const responseBuilder = new ResponseBuilder(res);
        let originalUrl = req.originalUrl;
        let requestedUrl = req.params[0];
        let parsedRequestUrl = url.parse(requestedUrl)
        let corsBaseUrl = '//' + req.get('host');
        
        console.info(req.protocol + '://' + req.get('host') + originalUrl);
        
        if(requestedUrl == ''){
            res.send(index);
            return;
        }        
        if(!parsedRequestUrl.host) {
            res.status(400);
            res.send("Invalid Url '" + requestedUrl + "'");
            return
        }

        if(debug) {
            console.info("Req headers:" , JSON.stringify(req.headers));
        }
        
        request(
            {
                encoding: null,
                uri: requestedUrl,
                resolveWithFullResponse: true,
            })
        .then(originResponse => {            
            let charset;
            if (originResponse.headers['content-type']) {
                if (originResponse.headers["content-type"].match(/charset=(.*)/) &&
                    originResponse.headers["content-type"].match(/charset=(.*)/)[1]) {
                    charset = originResponse.headers["content-type"].match(/charset=(.*)/)[1]
                }
                if (charset) {
                    const conv = new Iconv(charset, 'utf-8');
                    originResponse.body = conv.convert(originResponse.body).toString();
                }
            }

            responseBuilder
                .addHeaderByKeyValue('Access-Control-Allow-Origin', '*')
                .addHeaderByKeyValue('Access-Control-Allow-Credentials', false)
                .addHeaderByKeyValue('Access-Control-Allow-Headers', 'Content-Type')
                .addHeaderByKeyValue('X-Proxied-By', 'cors-container')
                .addHeaderByKeyValue('content-type', 'text/html; charset=windows-1251')
                .build(originResponse.headers);
            if(req.headers['not-rewrite-urls']){
                res.send(originResponse.body);                
            }else{
                res.send(
                    converter
                        .convert(originResponse.body, requestedUrl)
                        .replace(requestedUrl, corsBaseUrl + '/' + requestedUrl)
                ); 
            }
        })
        .catch(originResponse => {
            responseBuilder
                .addHeaderByKeyValue('Access-Control-Allow-Origin', '*')
                .addHeaderByKeyValue('Access-Control-Allow-Credentials', false)
                .addHeaderByKeyValue('Access-Control-Allow-Headers', 'Content-Type') .addHeaderByKeyValue('X-Proxied-By', 'cors-containermeh') .build(originResponse.headers);

            res.status(originResponse.statusCode || 500);
            
            return res.send(originResponse.message);
        });
    });
};