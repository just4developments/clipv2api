let Hapi = require('hapi');
let corsHeaders = require('hapi-cors-headers');
let async = require('async');
let unirest = require('unirest');

let utils = require('./service/utils');
let keywords = require('./service/keyword.class');
let HashService = require('./service/hash-service');

const server = new Hapi.Server({
  cache: [
    {
      name: 'mongoCache',
      engine: require('catbox-mongodb'),
      partition: 'clipv2',
    }
  ]
});
server.connection({ 
  port: 8000 
});

const cacheExpires = {
  newest: 5 * 60 * 1000,
  most: 10 * 60 * 1000,
  hot: 15 * 60 * 1000,
  detail: 5 * 60 * 1000,
  relate: 5 * 60 * 1000,
  keyword: 5 * 60 * 1000
};
const clipCached = server.cache({ 
  cache: 'mongoCache', 
  segment: 'cached',
  expiresIn: 15 * 60 * 1000
});

server.route({
  method: 'GET',
  path:'/keywords',
  handler: function (request, reply) {
    reply(keywords).header('etag', '59aeb2c9970b7b25be2fab2317e31fcb');
  }
});

server.route({
  method: 'GET',
  path:'/video/keyword',
  handler: function (request, reply) {
    var keyword = request.query.keyword;
    if(!keyword) return reply(null);
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;    
    page = parseInt(page);
    rows = parseInt(rows);

    var key = `keyword.${page}.${rows}.${keyword}`;
    clipCached.get(key, (err, value, cached) => {
      if(err) return console.error(err);
      if(cached !== null) return reply(value).header('last-modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({keywords: keyword, status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.keyword, (err) => { if (err) return console.error(err); });
        reply(rs).header('last-modified', new Date().toUTCString());
      });
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/newest',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 12;
    page = parseInt(page);
    rows = parseInt(rows);    
    var key = `newest.${page}.${rows}`;
    clipCached.get(key, (err, value, cached) => {
      if(err) return console.error(err);
      if(cached !== null) return reply(value).header('last-modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {        
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.newest, (err) => { if (err) return console.error(err); });
        reply(rs).header('last-modified', new Date().toUTCString());
      });
    });    
  }
});

server.route({
  method: 'GET',
  path:'/video/most',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);
    var key = `most.${page}.${rows}`;
    clipCached.get(key, (err, value, cached) => {
      if(err) return console.error(err);
      if(cached !== null) return reply(value).header('last-modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({status: 1}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.most, (err) => { if (err) return console.error(err); });
        reply(rs).header('last-modified', new Date().toUTCString());
      });
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/hot',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);

    var key = `hot.${page}.${rows}`;
    clipCached.get(key, (err, value, cached) => {
      if(err) return console.error(err);
      if(cached !== null) return reply(value).header('last-modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({status: 1}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.hot, (err) => { if (err) return console.error(err); });
        reply(rs).header('last-modified', new Date().toUTCString());
      });
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/{id}',
  handler: function (request, reply) {
    if(request.params.id === undefined) return reply(null);

    var key = `detail.${request.params.id}`;
    clipCached.get(key, (err, value, cached) => {
      if(err) return console.error(err);
      var db = request.server.plugins['hapi-mongodb'].db;
      var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
      if(cached !== null) {
        db.collection('clip').update(
          {_id: new ObjectID(request.params.id)}, 
          { $inc: {viewcount: 1} }, (err, rs) => {
            if(err) console.error(err);
            return reply(value).header('last-modified', new Date(cached.stored).toUTCString());
          });          
      }else{      
        db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
          if (err) console.error(err);
          if(!rs) return reply(null);
          rs.viewcount++;
          clipCached.set(key, rs, cacheExpires.detail, (err) => { if (err) return console.error(err); });
          db.collection('clip').updateOne({_id: rs._id}, { $set: { viewcount : rs.viewcount } }, (err, rs0) => {
            reply(rs).header('last-modified', new Date().toUTCString());
          });      
        });
      }
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/search',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    var txtSearch = request.query.txtSearch;
    page = parseInt(page);
    rows = parseInt(rows);

    var where = {status: 1};
    if(txtSearch){
      where['$text'] = { $search: txtSearch };
    }

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find(where).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/relate',
  handler: function (request, reply) {
    var id = request.query.id;    
    if(!id) return reply(null);
    var keywords = request.query.keywords;
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);
    
    var key = `relate.${id}`;    
    clipCached.get(key, (err, value, cached) => {
      if(err) return console.error(err);
      if(cached !== null) return reply(value).header('last-modified', new Date(cached.stored).toUTCString());
      var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
      id = new ObjectID(id)
      var where = {_id: {$ne: id}, status: 1};    
      if(keywords){
        keywords = keywords.split(',');
        if(keywords.length > 0) {
          if(keywords.length > 1) where.keywords = {$in : keywords};
          else where.keywords = keywords[0];
        }
        where.updateat = {$lte: new Date(request.query.updateat)}
      }
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find(where).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        if(rs.length < rows){
          delete where.keywords;
          if(rs.length > 0) {
            var ids =rs.map((v)=>{ return v._id;});
            ids.push(id);
            where._id = {$nin: ids};
          }
          db.collection('clip').find(where).sort([['updateat', -1]]).limit(rows - rs.length).toArray((err, rs0) => {
            if (err) return console.error(err); 
            rs = rs.concat(rs0);
            clipCached.set(key, rs, cacheExpires.relate, (err) => { if (err) return console.error(err); });
            reply(rs).header('last-modified', new Date().toUTCString());
          });
        }else{
          clipCached.set(key, rs, cacheExpires.relate, (err) => { if (err) return console.error(err); });
          reply(rs).header('last-modified', new Date().toUTCString());
        }
      });
    });
  }
});

server.route({
  method: 'GET',
  path:'/myvideo',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').find({creator: request.headers.me}).sort({updateat: -1}).limit(20).toArray((err, rs) => {
      if (err) return console.error(err);      
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/youtube/{id}',
  handler: function (request, reply) {
    let url = 'https://www.googleapis.com/youtube/v3/videos?id=' + request.params.id + '&key=' + utils.googleapikey + '&fields=items(snippet(title),contentDetails(duration))&part=snippet,contentDetails';
    unirest('GET', url, {
      'Host': 'www.googleapis.com',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.87 Safari/537.36'
    }, null, (res)=>{
      if(res.statusCode !== 200) {
        console.error('Get youtube infor error ', res.statusCode, headers, url);
        return reply(null).status(500);
      }
      var e = {};
      var item = res.body;
      item = item.items;
      if(item.length > 0) item = item[0];
      e.title = item.snippet.title;
      e.rawtitle = item.snippet.title;        
      e.duration = utils.getDuration(item.contentDetails.duration);
      reply(e);
    });
  }
});

server.route({
  method: 'POST',
  path:'/video',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    var data = [];
    var copyToItem = (payload, cb) => {
      var item = {};
      item.title = payload.title || payload.rawtitle;
      item.creator = payload.creator;
      item.link = payload.link;
      if(payload.youtubeid) item.youtubeid = payload.youtubeid;
      if(payload.facebookid) item.facebookid = payload.facebookid;
      item.image = payload.image;
      item.site = 'http://localhost/';
      item.status = 0;
      item.utitle = utils.toUnsigned(item.title + " <|> " + payload.rawtitle);
      if(payload.duration) item.duration = utils.getDuration(payload.duration); 
      item = utils.appendDefaultAttr(item, keywords);
      cb(item);
    };
    var jobs = [];
    if(request.payload instanceof Object){      
      jobs.push(((payload, cb) => {
        copyToItem(payload, (item)=>{
          cb(null, item);
        });
      }).bind(null, request.payload));
    }    
    async.series(jobs, (err, data) => {
      db.collection('clip').insertMany(data, (err, rs) => {
        if (err) return console.error(err);
        reply(data);
      });
    });    
  }
});

server.route({
  method: 'PUT',
  path:'/video/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      rs.status = 1;
      rs.updateat = new Date();
      db.collection('clip').updateOne({_id: rs._id}, { $set: { status : rs.status } }, (err, rs0) => {
        reply(rs);
      });      
    });
  }
});

server.route({
  method: 'DELETE',
  path:'/video/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      if(rs.creator === request.headers.me){
        db.collection('clip').deleteOne({_id: rs._id}, { $set: { viewcount : rs.viewcount } }, (err, rs0) => {
          reply(rs);
        });      
      }else{
        reply(new Error({code:403}));
      }
    });
  }
});

server.route({
  method: 'POST',
  path:'/login',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;    
    var token = request.payload.token;
    if(!token) return reply(null);
    var graph = require('fbgraph');
    graph.setAccessToken(token);
    graph.setVersion("2.6");
    graph.get("me?fields=email,name", function(err, res) {        
      let email = res.email;
      if(!email) return reply(null);
      db.collection('user').findOne({email: email}, (err, rs) => {
        if(err) return reply(null);        
        if(rs === null){
          db.collection('user').insertOne({email: email, name: res.name}, (err, rs) => {
            if (err) return reply(null);            
            reply(rs.ops[0]);
          });
        }else{
          reply(rs);
        }
      });      
    });    
  }
});

server.ext('onPreResponse', corsHeaders);
if(!process.argv[2]){
  server.ext('onPostHandler', function(request, reply) {  
    var response = request.response;
    if (!response.isBoom && response.source) {
      response.headers['content-type'] = 'encryption/json';
      response.source = HashService.encrypt(response.source);
    }
    return reply.continue();
  });
}
server.register({
  register: require('hapi-mongodb'),
  options: {
    "url": "mongodb://localhost:27017/clipv2",
    "settings": {
      "db": {
        "native_parser": false
      }
    }
  }
}, function (err) {
  if (err) {
    console.error(err);
    throw err;
  }
  server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
  });
});