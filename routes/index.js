
/*
 * GET home page.
 */

var title = 'Monstercat United';

var mongoose = require("mongoose");
var path = require("path");
var zlib = require("zlib");
var fs = require('fs');
var _ = require("underscore");
var Recaptcha = require('recaptcha').Recaptcha;
var ArrayFormatter = require('../formatters').ArrayFormatter;


var PUBLIC_KEY  = '6LcXaNYSAAAAAIVQ-H4GWTwuKi_kBq_4ixT0H3YG',
    PRIVATE_KEY = '6LcXaNYSAAAAALLH4B2VmNIqj8oh_FdjyD8aJ5Pb';

var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var EggSchema = new Schema({
    name: String
  , email: String
  , eggId: String
  , claimedAt: Date
});

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
var Egg = mongoose.model('Egg', EggSchema);

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
  res.render('index', {
    title: title,
    err: null
  });
};

exports.found = function(req, res){
  var form = req.body;

  Egg.findOne({ eggId: form.eggId }, function(err, doc){
    console.log(err, doc);
    var alreadyFound = !!doc;
    if (alreadyFound) {
      res.status(500);
      return res.json({ err: "already found :(", err_code: "already_found" });
    }

    var egg = new Egg(form);
    egg.save();

    return res.json({ message: "Congrats!" });
  });
};

exports.claimed = function(req, res) {
  var formatter = new ArrayFormatter();
  var gzipper   = zlib.createGzip();

  Egg.find(function(err, eggs){
    var ids = _(eggs).map(function(egg){ return egg.eggId; });
    return res.json(ids);
  });
};

exports.index_submit = function(req, res){
  console.log(req.body);
  var data = {
    remoteip:  req.connection.remoteAddress,
    challenge: req.body.recaptcha_challenge_field,
    response:  req.body.recaptcha_response_field
  };
  console.log(data);
  var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data);

  recaptcha.verify(function(success, error_code) {
    if (success) {
      console.log("success")

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
    }
    else {
      console.log("fail")
      res.status(500)
      return res.json({err: "Failed Captcha", msg: "", err_code: error_code })
        // Redisplay the form.

    }
  });



};
