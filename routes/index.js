
/*
 * GET home page.
 */

var title = 'Monstercat Photo Submit';

var mongoose = require("mongoose");
var path = require("path");
var fs = require('fs');

var Schema   = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var PhotoUploadSchema = new Schema({
    name: String
  , email: String
  , signature: String
  , createdDate: Date
  , filename: String
});
var PhotoUpload = mongoose.model('PhotoUpload', PhotoUploadSchema)


exports.index = function(req, res){
  res.render('index', { title: title, err: null })
};


exports.index_submit = function(req, res){

  var form = req.body;

  var hasErr = false;
  var err = null;
  function check(cond, newErr){
    hasErr = !cond || hasErr;
    err = err || (!cond? newErr : null);
  }

  check(form.name !== "", "Name field must not be empty");
  check(form.email !== "", "Email field must not be empty");
  check(req.files.upload.name !== "", "No photo uploaded");
  check(form.signatureName !== "", "Signature Name must not be empty");
  check(form.signature === "on", "You must agree to the terms");

  if (hasErr) {
    return res.render('index', { title: title, err: err })
  }

  var up = req.files.upload;
  var dir = path.dirname(up.path);
  var filename = path.basename(up.path) + "_" + up.name;
  var newname = path.join(dir, filename);

  fs.rename(up.path, newname);

  var photo = new PhotoUpload({
      name: form.name
    , email: form.email
    , signature: form.signatureName
    , filename: filename
    , createdDate: new Date()
  });

  photo.save();

  res.render('done', { title: title, err: null })
};
