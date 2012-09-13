
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , mongoose = require('mongoose')
  , path    = require('path')
  , recaptcha = require('recaptcha').Recaptcha;

var app = module.exports = express.createServer();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser())
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

mongoose.connect("mongodb://localhost/test", { auto_reconnect: true });

app.get('/', routes.index);
app.get('/pins', routes.pins);
app.post('/', routes.index_submit);
app.post('/found', routes.found);
app.get('/found', routes.claimed);
app.get('/isNear', routes.isNear);

app.listen(5010, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
