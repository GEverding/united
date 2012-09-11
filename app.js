
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , path    = require('path');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

mongoose.connect("mongodb://localhost/test", { auto_reconnect: true });

app.get('/', routes.index);
app.get('/pins', routes.pins);
app.post('/', routes.index_submit);

app.listen(5010, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
