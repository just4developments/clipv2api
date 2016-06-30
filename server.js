const Hapi = require('hapi');
const corsHeaders = require('hapi-cors-headers');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000 
});

// Add the route
server.route({
  method: 'GET',
  path:'/video/newest',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['updateat', -1]]).skip(0).limit(20).toArray((err, rs) => {
      if (err) return console(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/relate',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['updateat', -1]]).skip(0).limit(10).toArray((err, rs) => {
      if (err) return console(err);
      reply(rs);
    });
  }
});

server.route({
  method: 'GET',
  path:'/video/most',
  handler: function (request, reply) {
    var db = request.server.plugins['hapi-mongodb'].db;
    db.collection('clip').find({}).sort([['viewcount', -1], ['updateat', -1]]).skip(0).limit(10).toArray((err, rs) => {
      if (err) return console(err);
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
      if (err) return console(err);
      rs.viewcount++;
      db.collection('clip').updateOne({_id: rs._id}, { $set: { viewcount : rs.viewcount } }, (err, rs0) => {
        reply(rs);
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