const Hapi = require('hapi');
const corsHeaders = require('hapi-cors-headers');
const async = require('async');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000 
});

const utils = require('./service/utils');
const keywords = require('./service/keyword.class');

// Add the route

server.route({
  method: 'GET',
  path:'/keywords',
  handler: function (request, reply) {
    reply(keywords);
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

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({keywords: keyword, status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/newest',
  handler: function (request, reply) {
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({status: 1}).sort([['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
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
    var keywords = request.query.keywords;
    if(!id) return reply(null);
    var page = request.query.page || 1;
    var rows = request.query.rows || 10;
    page = parseInt(page);
    rows = parseInt(rows);
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
          reply(rs.concat(rs0));          
        });
      }else{
        reply(rs);
      }
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

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({status: 1}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
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

    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({status: 1}).sort([['viewcount', -1], ['updateat', -1]]).skip((page-1)*rows).limit(rows).toArray((err, rs) => {
      if (err) return console.error(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/{id}',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    db.collection('clip').findOne({_id: new ObjectID(request.params.id)}, (err, rs) => {
      if (err) return console.error(err);
      rs.viewcount++;
      db.collection('clip').updateOne({_id: rs._id}, { $set: { viewcount : rs.viewcount } }, (err, rs0) => {
        reply(rs);
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
  method: 'POST',
  path:'/video',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    var ObjectID = request.server.plugins['hapi-mongodb'].ObjectID;
    var data = [];
    var copyToItem = (payload, cb) => {
      var item = {};
      item.title = payload.title;
      item.creator = payload.creator;
      item.link = payload.link;
      item.youtubeid = payload.youtubeid;
      item.site = 'http://localhost/';
      item.status = 0;
      item = utils.applyInfor(item, keywords, cb);  
      return item;
    };
    var jobs = [];
    if(request.payload instanceof Array){
      for(var a of request.payload){
        jobs.push(((payload, cb) => {
          // copyToItem(payload, (item)=>{
          //   cb(null, item);
          // });
        }).bind(null, a));
      }
    }else{
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
server.register({
  register: require('hapi-mongodb'),
  options: {
    "url": "mongodb://localhost:27017/test",
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

  // Start the server
  server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
  });
});