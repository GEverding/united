var Stream = require("stream").Stream;

function ArrayFormatter () {
  Stream.call(this);
  this.writable = true;
  this._done = false;
  this.written = 0;
}

ArrayFormatter.prototype.__proto__ = Stream.prototype;

ArrayFormatter.prototype.write = function (doc) {
  this.written++;
  if (! this._hasWritten) {
    this._hasWritten = true;

    // open an object literal / array string along with the doc
    this.emit('data', '{ "results": [' + JSON.stringify(doc) );

  } else {
    this.emit('data', ',' + JSON.stringify(doc));
  }

  return true;
}

ArrayFormatter.prototype.end =
ArrayFormatter.prototype.destroy = function () {
  if (this._done) return;
  this._done = true;

  // close the object literal / array
  if (this.written === 0) {
    this.emit('data', '{[');
  }
  this.emit('data', ']}');
  // done
  this.emit('end');
}

exports.ArrayFormatter = ArrayFormatter;
