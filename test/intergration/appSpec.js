'use strict';

const request = require('supertest');
const nock = require('nock');
const app = require('../../app');
                 
describe('GET /http://jacob.uk.com', function(){
    it('should respond with expected headers', function(done){
        request(app)
            .get('/https://www.jacob.uk.com')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Headers', 'Content-Type')
            .expect('Access-Control-Allow-Credentials', 'false')
            .expect('X-Proxied-By', 'cors-container')
            .expect(200, done);
    });
    
    it('should respect headers set by origin', function(done){
        request(app)
            .get('/https://www.jacob.uk.com/')
            .expect('content-type', 'text/html; charset=utf-8')
            .expect(200, done);
    });
    
    it('should respond with expected not found status code', function(done){
        request(app)
            .get('/https://www.jacob.uk.com/i-do-not-exist')
            .expect(404, done);
    });
    
    it('should rewrite relative paths when rewrite-url header is true', function(done){
        let relativeUrlMockResponse = nock('https://blog.jacob.uk.com')
            .get('/')
            .reply(200, '<a href="/a-blog-post">');
            
        request(app)
            .get('/https://blog.jacob.uk.com/')
            // .set('rewrite-urls', 'true')
            .expect('Access-Control-Allow-Origin', '*')
            .expect('Access-Control-Allow-Headers', 'Content-Type')
            .expect('Access-Control-Allow-Credentials', 'false')
            .expect('X-Proxied-By', 'cors-container')
            .expect(/<a href="\/\/127.0.0.1:[0-9]+\/https:\/\/blog.jacob.uk.com\/a-blog-post">/, done);
    })
});