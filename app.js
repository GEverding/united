
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , path    = require('path')
  , recaptcha = require('recaptcha').Recaptcha;

var app = module.exports = express.createServer();
var io = module.exports = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.logger());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

mongoose.connect("mongodb://localhost/test", { auto_reconnect: true });

io.sockets.on('connection', function(socket){
  var feed = null;
  routes.GetFeed(function(err, feed_){
    if(err){
      console.log(err);
      return null;
    }
    else
      feed = feed_;
      //console.log(feed)
      socket.emit('new', {feed: feed_});
  });
  console.log("Feed: ", feed);


  socket.on('newPost', function(data){
    var update = routes.UpdateFeed(function(err, update_){
      if(err){
        console.log(err);
        return null;
      }
      else
        update = update_;
        console.log(update);
        io.sockets.emit('feedUpdate', {update: update});
        return update_;
    });
  });
});

app.get('/', routes.index);
app.get('/pins', routes.pins);
app.post('/', routes.index_submit);
app.post('/found', routes.found);
app.get('/found', routes.claimed);
app.get('/isNear', routes.isNear);

app.listen(5010, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
