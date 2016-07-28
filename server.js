let Hapi = require('hapi');
let corsHeaders = require('hapi-cors-headers');
let async = require('async');
let unirest = require('unirest');
let fs = require('fs');

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

let lastModifiedKeyword = new Date(fs.statSync('./service/keyword.class.js').mtime).toUTCString();
server.route({
  method: 'GET',
  path:'/keywords',
  handler: function (request, reply) {
    reply(keywords).header('Last-Modified', lastModifiedKeyword);
  }
});

// ADMIN

server.route({
  method: 'GET',
  path:'/user-in-web',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 100;    
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    var html = '';
    html += `<table border="1" cellpadding="5" cellspacing="1">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Email</th>
                  <th>Create at</th>
                </tr>
              </thead>
              <tbody>
    `;
    db.collection('user').find().sort(['createat', -1]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      var i = 1;
      for(var r of rs){        
        html += '<tr>';
        html += `<th>${i}</th>`;
        html += `<td>${r.email}</td>`;
        html += `<td>${r.createat.toUTCString()}</td>`;
        html += '</tr>';
        i++;
      }
      html += '</tbody></table>';
      reply(html).header('encrypt', '0');
    });

  }
});

server.route({
  method: 'GET',
  path:'/video/waiting',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 100;    
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    var html = '';
    html += `<table border="1" cellpadding="5" cellspacing="1">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Creator</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
    `;
    db.collection('clip').find({status: 0}).sort(['createat', 1]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);            
      for(var r of rs){
        html += '<tr>';
        html += `<td>${r.title}</td>`;
        html += `<td>${r.creator}</td>`;
        html += `<td><a href="/video/pass/${r._id}" target="32o423809">Passed</a>&nbsp;&nbsp;&nbsp;<a href="/video/remove/${r._id}" target="32o423809">Remove</a></td>`;
        html += '</tr>';
      }
      html += '</tbody></table>';
      reply(html).header('encrypt', '0');
    });

  }
});

server.route({
  method: 'GET',
  path:'/video/pass/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      rs.status = 1;
      rs.updateat = new Date();
      db.collection('clip').updateOne({_id: rs._id}, { $set: { status : rs.status } }, (err, rs0) => {
        reply(rs).header('encrypt', '0');
      });      
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/remove/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      rs.status = -1;
      rs.updateat = new Date();
      db.collection('clip').updateOne({_id: rs._id}, { $set: { status : rs.status } }, (err, rs0) => {
        reply(rs).header('encrypt', '0');
      });      
    });
  }
});

// END ADMIN

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
      if(cached !== null) return reply(value).header('Last-Modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({keywords: keyword, status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.keyword, (err) => { if (err) return console.error(err); });
        reply(rs).header('Last-Modified', new Date().toUTCString());
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
      if(cached !== null) return reply(value).header('Last-Modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {        
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.newest, (err) => { if (err) return console.error(err); });
        reply(rs).header('Last-Modified', new Date().toUTCString());
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
      if(cached !== null) return reply(value).header('Last-Modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({status: 1}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.most, (err) => { if (err) return console.error(err); });
        reply(rs).header('Last-Modified', new Date().toUTCString());
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
      if(cached !== null) return reply(value).header('Last-Modified', new Date(cached.stored).toUTCString());
      var db = request.server.plugins['hapi-mongodb'].db;
      db.collection('clip').find({isSpecial: true, status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
        if (err) return console.error(err);
        clipCached.set(key, rs, cacheExpires.hot, (err) => { if (err) return console.error(err); });
        reply(rs).header('Last-Modified', new Date().toUTCString());
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
            return reply(value).header('Last-Modified', new Date(cached.stored).toUTCString());
          });          
      }else{      
        db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
          if (err) console.error(err);
          if(!rs) return reply(null);
          rs.viewcount++;
          clipCached.set(key, rs, cacheExpires.detail, (err) => { if (err) return console.error(err); });
          db.collection('clip').updateOne({_id: rs._id}, { $set: { viewcount : rs.viewcount } }, (err, rs0) => {
            reply(rs).header('Last-Modified', new Date().toUTCString());
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
      if(cached !== null) return reply(value).header('Last-Modified', new Date(cached.stored).toUTCString());
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
            reply(rs).header('Last-Modified', new Date().toUTCString());
          });
        }else{
          clipCached.set(key, rs, cacheExpires.relate, (err) => { if (err) return console.error(err); });
          reply(rs).header('Last-Modified', new Date().toUTCString());
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
    db.collection('clip').find({creatorid: request.headers.me}).sort({updateat: -1}).limit(20).toArray((err, rs) => {
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
    var copyToItem = (payload, cb) => {
      var item = {};
      item.title = payload.title || payload.rawtitle;
      item.creator = payload.creator;
      item.creatorid = request.headers.me;
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
    copyToItem(request.payload, (item)=>{
      var where = {};
      if(item.facebookid) where.facebookid = item.facebookid;
      if(item.youtubeid) where.youtubeid = item.youtubeid;
      db.collection('clip').find(where).limit(1).toArray((err, rs)=>{
        if(err) return console.error(err);
        if(rs && rs.length > 0){
          reply([]);
        }else{
          db.collection('clip').insertOne(item, (err, rs) => {
            if (err) return console.error(err);
            reply(rs.ops);
          });
        }
      })            
    });
  }
});

server.route({
  method: 'PUT',
  path:'/video/{id}',
  handler: function (request, reply) {
    if(request.payload.keywordid === undefined && request.payload.isSpecial === undefined && request.payload.status === undefined) return reply(new Error({code:500}));
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      var key = `detail.${rs._id}`;
      if(request.payload.keywordid !== undefined){
        var idx = rs.keywords.indexOf(request.payload.keywordid);
        if(idx !== -1){
          rs.keywords.splice(idx, 1);
        }else{
          rs.keywords.push(request.payload.keywordid);
        }
        rs.updateat = new Date();
        db.collection('clip').updateOne({_id: rs._id}, { $set: {keywords: rs.keywords, updateat: rs.updateat} }, (err, rs0) => {          
          clipCached.drop(key, (err) => { if (err) return console.error(err); })
          reply(rs.keywords);
        });
      }else if(request.payload.isSpecial !== undefined){
        rs.isSpecial = request.payload.isSpecial;
        rs.updateat = new Date();
        db.collection('clip').updateOne({_id: rs._id}, { $set: {isSpecial: rs.isSpecial, updateat: rs.updateat} }, (err, rs0) => {
          clipCached.drop(key, (err) => { if (err) return console.error(err); })
          reply(rs.isSpecial);
        });
      }else if(request.payload.status !== undefined){
        rs.status = request.payload.status;
        rs.updateat = new Date();
        db.collection('clip').updateOne({_id: rs._id}, { $set: {status: rs.status, updateat: rs.updateat} }, (err, rs0) => {
          clipCached.drop(key, (err) => { if (err) return console.error(err); })
          reply(rs.status);
        });
      }
    });
  }
});

server.route({
  method: 'DELETE',
  path:'/video/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id), status: 0}, (err, rs) => {
      if (err) return console.error(err);
      if(rs && rs.creatorid === request.headers.me){
        db.collection('clip').deleteOne({_id: rs._id}, (err, rs0) => {
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
          db.collection('user').insertOne({email: email, name: res.name, favorites: [], status: 1, createat: new Date(), updateat: new Date()}, (err, rs) => {
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

server.route({
  method: 'POST',
  path:'/favorite',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('user').findOne({_id: new ObjectID(request.headers.me)}, (err, rs) => {
      if (err) return console.error(err);
      if(rs._id.toString() === request.headers.me){
        rs.favorites.push(request.payload);
        db.collection('user').update({_id: rs._id}, { $set: { favorites : rs.favorites } }, (err, rs0) => {
          if (err) return console.error(err);
          reply(rs.favorites);
        });      
      }else{
        reply(new Error({code:403}));
      }
    });
  }
});

server.route({
  method: 'DELETE',
  path:'/favorite/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('user').findOne({_id: new ObjectID(request.headers.me)}, (err, rs) => {
      if (err) return console.error(err);
      db.collection('user').update({_id: rs._id}, { $pull: { 'favorites': { _id: request.params.id } } }, (err, rs0) => {
        rs.favorites.splice(rs.favorites.findIndex((e, idx, arr) => {
          if(e._id === request.params.id) return true;
          return false;
        }), 1);
        reply(rs.favorites);
      });
    });
  }
});

server.ext('onPreResponse', corsHeaders);
if(!process.argv[2]){  
  server.ext('onPostHandler', function(request, reply) {      
    var response = request.response;
    if (!response.isBoom && response.source && response.headers['encrypt'] !== '0' && request.headers['decrypt'] === undefined) {
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