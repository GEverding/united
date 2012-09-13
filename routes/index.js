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

var allEggs = [
  { location: [31.137751,29.975309], eggId: 'a', difficulty: 12,
    message: "The original Monstercat."
  },
  { location: [23.71985,61.502224], eggId: 'b', difficulty: 12,
    message: "Oldest operational Sauna in Finland!"
  },
  { location: [-105.918694,35.50936], eggId: 'c', difficulty: 12,
    message: ""
  },
  { location: [86.9233,27.9856], eggId: 'd', difficulty: 12,
    message: "#OperationDethrone"
  },
  { location: [46.64,-19.39], eggId: 'e', difficulty: 12,
    message: "You have found the secret Monstercat. SHUT. DOWN. EVERYTHING.",
    scale: 8
  }
];


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

    var eggIds = ['a', 'b', 'c', 'd', 'e'];

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
      check(!!form.lat, "Missing latitude");
      check(!!form.lng, "Missing longitude");

      if (hasErr) {
        res.status(500);
        return res.json({err: err });
      }

      var pin = new Pin({
        name: form.name,
        lat: form.lat,
        lng: form.lng,
        message: form.message
      });

      pin.save();

      res.cookie('unitedMarker', pin._id, {expires: null, path: '/'});
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
  var body = req.body;
  var q = {
    loc: {
      $near: [body.lng, body.lat],
      $maxDistance: 5
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
      });
    } else {
      res.status(404);
      return res.json({});
    }
  });
};
