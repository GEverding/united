/*jshint laxcomma:true*/

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
  , message: String
  , lat: Number
  , lng: Number
  , date: {
      type: Date,
      default: Date.now()
  }
});

var EggLocationSchema = new Schema({
    location: {
      type: [Number],
      index: '2d'
    }
  , eggId: String
  , scale: Number
  , difficulty: Number
  , message: String
});

var Pin = mongoose.model('Pin', PinSchema);
var Egg = mongoose.model('Egg', EggSchema);
var EggLoc = mongoose.model('EggLoc', EggLocationSchema);

exports.pins = function(req, res){
  var formatter = new ArrayFormatter();
  var gzipper   = zlib.createGzip();

  res.writeHead(200, {
    'content-encoding': 'gzip',
    'content-type': 'application/json'
  });

  Pin.find({})
     .stream()
     .pipe(formatter)
     .pipe(gzipper)
     .pipe(res);
};

exports.index = function(req, res){
  Egg.find({}, function(err, eggs){
    function anyId(id){
      return _(eggs).any(function(egg){
        return egg.eggId === id;
      });
    }

    function getName(id){
      var maybeEgg = _(eggs).find(function(egg){
        return egg.eggId === id;
      });

      return !maybeEgg ? '' : maybeEgg.name;
    }

    var eggIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

    var cats = _(eggIds).map(function(eggId){
      var d = {};
      d = _.extend(d, {
        found: anyId(eggId),
        name: getName(eggId),
        eggId: eggId
      });
      return d;
    });

    res.render('index', {
      title: title,
      err: null,
      cats: cats
    });
  });
};

exports.found = function(req, res){
  var form = req.body;

  Egg.findOne({ eggId: form.eggId }, function(err, doc){
    var alreadyFound = !!doc;
    if (alreadyFound) {
      res.status(500);
      return res.json({ err: "already found :(", err_code: "already_found" });
    }

    EggLoc.findOne({ eggId: form.eggId }, function(err, eggLoc){
      if (err || !eggLoc)
        return res.json({ message: "Invalid egg" });

      if (""+form.lat !== ""+eggLoc.location[1] ||
          ""+form.lng !== ""+eggLoc.location[0]) {
        return res.json({ message: "Nice try :)" });
      }

      var egg = new Egg(form);
      egg.save();

      return res.json({ message: "Congrats!" });
    });

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
  var data = {
    remoteip:  req.connection.remoteAddress,
    challenge: req.body.recaptcha_challenge_field,
    response:  req.body.recaptcha_response_field
  };
  var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY, data);

  recaptcha.verify(function(success, error_code) {
    if (success) {

      var form = req.body;
      var hasErr = false;
      var err = null;

      var check = function (cond, newErr){
        hasErr = !cond || hasErr;
        err = err || (!cond? newErr : null);
      };

      check(form.name !== "", "Name field must not be empty");
      check(form.location !== "", "Location field must not be empty");
      check(form.message !== "", "Message must not be empty");
      if (form.message)
        check(form.message.length <= 140, "Message too long");
      check(!!form.lat, "Missing latitude");
      check(!!form.lng, "Missing longitude");

      if (hasErr) {
        res.status(500);
        return res.json({err: err });
      }

      var pin = new Pin({
        name: form.name,
        date: Date.now(),
        lat: form.lat,
        lng: form.lng,
        message: form.message
      });

      pin.save();

      res.cookie('monstercat', pin._id, {expires: null, path: '/'});
      return res.json({});
    }
    else {
      res.status(500);
      return res.json({err: "Failed Captcha", msg: "", err_code: error_code });

    }
  });



};

exports.isNear = function(req, res){
  // Assuming req.body will have to variables
  //   - lat
  //   - lng
  var body = req.query;
  var q = {
    location: {
      $near: [+body.lng, +body.lat],
      $maxDistance: 0.8
    }
  };

  // query requires form to be in y, x form for some reason
  EggLoc.findOne(q, function(err, loc){
    if (loc) {
      return res.json({
          message: loc.message
        , lat: loc.location[1]
        , lng: loc.location[0]
        , eggId: loc.eggId
        , scale: loc.scale
        , difficulty: loc.difficulty
      });
    } else {
      res.status(404);
      return res.json({});
    }
  });
};

exports.UpdateFeed = function(cb){
  return Pin.find({}).sort("$natural", "descending").limit(1).exec(cb);
};

exports.GetFeed = function(cb){
  Pin.find({}).sort("$natural", "descending" ).limit(25).exec(cb);
};
