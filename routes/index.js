
/*
 * GET home page.
 */

var title = 'Monstercat United';

var mongoose = require("mongoose");
var path = require("path");
var zlib = require("zlib");
var fs = require('fs');
var _ = require("underscore");
var ArrayFormatter = require('../formatters').ArrayFormatter;

var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PinSchema = new Schema({
    name: String
  , city: String
  , state: String
  , zipCode: String
  , message: String
  , lat: Number
  , long: Number
});

var Pin = mongoose.model('Pin', PinSchema);

exports.pins = function(req, res){
  var formatter = new ArrayFormatter();
  var gzipper   = zlib.createGzip();

  res.writeHead(200, { 'content-encoding': 'gzip' });

  Pin.find({})
     .stream()
     .pipe(formatter)
     .pipe(gzipper)
     .pipe(res);
};

exports.index = function(req, res){
  res.render('index', { title: title, err: null });
};

exports.index_submit = function(req, res){
  console.log(req.body);

  var form = req.body;
  var hasErr = false;
  var err = null;

  function check(cond, newErr){
    hasErr = !cond || hasErr;
    err = err || (!cond? newErr : null);
  }

  check(form.name !== "", "Name field must not be empty");
  check(form.location !== "", "Location field must not be empty");
  check(form.message !== "", "Message must not be empty");
  check(!!form.lat, "Missing latitude");
  check(!!form.long, "Missing longitude");

  if (hasErr) {
    res.status(500);
    return res.json({err: err });
  }
  var pin = new Pin(form);
  console.log(pin.toObject())
  pin.save();

  res.render('done', { title: title, err: null });

};
