
var united = united || {};

var nav = null;
var geocoder = null;
var pin = {
    name: "",
    city: "",
    state: "",
    zip: "",
    message: "",
    lat: null,
    long: null
};

function requestPosition() {
    if (nav == null) {
        nav = window.navigator;
    }
    if (nav != null) {
        var geoloc = nav.geolocation;
        if (geoloc != null) {
            geoloc.getCurrentPosition(successCallback);
        }
        else {
            console.log("geolocation not supported");
        }
    }
    else {
        console.log("Navigator not found");
    }
}



function successCallback(position) {
    console.log(position.coords.latitude + ', ' + position.coords.longitude);
    pin.lat = position.coords.latitude;
    pin.long = position.coords.longitude;
    $("#lat").val(pin.lat);
    $("#lng").val(pin.long);
    initialize();

}

function placeOverlayAt(map, lat, lng, difficulty) {
  var hw = 0.004;
  var hh = 0.0031;
  var swBound = new google.maps.LatLng(lat - hw, lng - hh);
  var neBound = new google.maps.LatLng(lat + hw, lng + hh);
  var bounds = new google.maps.LatLngBounds(swBound, neBound);

  var srcImage = '/img/monstercat_findme.png';
  overlay = new MOverlay(bounds, srcImage, map, difficulty);

  function on(evt, cb) {
    google.maps.event.addListener(map, evt, cb);
  }

  function shouldShow() {
    var zoom = map.getZoom();
    return bounds.intersects(map.getBounds());
  }

  function showOrHide() {
    var center = map.getCenter();
    if (shouldShow()) {
      overlay.show();
    } else {
      overlay.hide();
    }
  }

  on('zoom_changed', showOrHide);
  on('center_changed', showOrHide);
}

function initialize() {
  geocoder = new google.maps.Geocoder();
  var map_options = {
      center: new google.maps.LatLng(pin.lat, pin.long),
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var google_map = new google.maps.Map(document.getElementById("map_canvas"), map_options);

  placeOverlayAt(google_map, 43.47865, -80.54977);

  var info_window = new google.maps.InfoWindow({
      content: 'loading'
  });
  var pins = null;
  $.ajax({
    type: "GET",
    url: "pins",
    //headers: { "Accept-Encoding" : "gzip" },
    success: function(data) {
      console.log("Successfull get");
      pins = JSON.parse(data);
      console.log(pins);

      for(i in pins.results){

        var res = pins.results[i];
        console.log(res);
        var m = new google.maps.Marker({
          map: google_map,
          animation: google.maps.Animation.DROP,
          title: res.Name,
          position: new google.maps.LatLng(res.lat, res.long),
          html: "<p><strong>"+ res.message +"</strong></p><footer><strong><i> - "+ res.name +"</i></strong></footer>"
        });
        console.log(m)
        google.maps.event.addListener(m, 'click', function() {
            info_window.setContent(this.html);
            info_window.open(google_map, this);
        });
        console.log("what is going on")

      }
    }
  });
}

function validate(){
    console.log("Validate Fire");
    var input = null;
    var val = null;
    var err;
    input = $("#name")
    if(input.val() === "" || input.val().length < 2){
      input.closest('.control-group').addClass('error');
      return false
    }
    pin.name = input.val()

    input = $("#state")
    if(input.val() === "" || input.val().length < 2) {
      input.closest('.control-group').addClass('error');
      return false;
    }
    pin.state = input.val();


    input = $("#city")
    if(input.val() === "" || input.val().length < 2) {
      input.closest('.control-group').addClass('error');
      return false;
    }
    pin.city = input.val();

    input = $("#zip")
    if(input.val() === "" || input.val().length < 2){
       input.closest('.control-group').addClass('error');
       return false;
    }
    pin.zip = input.val();

    input = $("#msg")
    if(input.val() === "" || input.val().length <= 1 || input.val().length > 140){
      input.closest('.control-group').addClass('error');
      return false;
    }
    pin.message = input.val()

    lat = $("#lat");
    lng = $("#lng");
    if(lat.val() === "" && lng.val() === "" ){
      var address = $("#city").val() + ", " + $("#state").val() + ", " + $("#zip").val();
      console.log(address);
      geocoder.geocode({"address": address}, function(res, status){
        if(status === google.maps.GeocoderStatus.OK){
          console.log(res[0].geometry.location)
          pin.lat = res[0].geometry.location.Xa;
          pin.long = res[0].geometry.location.Ya;
        }
      });
    }
    $.ajax({
      type: "POST",
      url: "",
      data: pin,
      success: function() {
        console.log("Successfull post");
        $("#form").slideUp();
      }
    });


}

//
// MOverlay
//
function MOverlay(bounds, image, map, difficulty) {

  this.ratio = 160 / 212;
  this.difficulty = difficulty || 11;

  // Now initialize all properties.
  this.bounds_ = bounds;
  this.image_ = image;
  this.map_ = map;

  // We define a property to hold the image's
  // div. We'll actually create this div
  // upon receipt of the add() method so we'll
  // leave it null for now.
  this.div_ = null;

  // Explicitly call setMap on this overlay
  this.setMap(map);
}

MOverlay.prototype = new google.maps.OverlayView();

MOverlay.prototype.onAdd = function() {

  // Note: an overlay's receipt of add() indicates that
  // the map's panes are now available for attaching
  // the overlay to the map via the DOM.

  // Create the DIV and set some basic attributes.
  var div = document.createElement('div');
  div.style.border = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';

  // Create an IMG element and attach it to the DIV.
  var img = document.createElement('img');
  img.src = this.image_;
  img.style.width = '100%';
  img.style.height = '100%';
  div.appendChild(img);

  // Set the overlay's div_ property to this DIV
  this.div_ = div;

  // We add an overlay to a map via one of the map's panes.
  // We'll add this overlay to the overlayImage pane.
  var panes = this.getPanes();
  panes.overlayImage.appendChild(this.div_);
}

function sigmoid(t) {
  var e = 2.71828182846;
  return 1 / (1 + Math.pow(e, -t));
}

MOverlay.prototype.draw = function() {
  // Size and position the overlay. We use a southwest and northeast
  // position of the overlay to peg it to the correct position and size.
  // We need to retrieve the projection from this overlay to do this.
  var overlayProjection = this.getProjection();

  // Retrieve the southwest and northeast coordinates of this overlay
  // in latlngs and convert them to pixels coordinates.
  // We'll use these coordinates to resize the DIV.
  var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
  var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

  // Resize the image's DIV to fit the indicated dimensions.
  var div = this.div_;
  var $div = $(this.div_);
  div.style.left = sw.x + 'px';
  div.style.top = ne.y + 'px';
  div.style.width = (ne.x - sw.x) + 'px';
  div.style.height = (sw.y - ne.y) + 'px';

  var zoom = this.map_.getZoom();
  var opacity = sigmoid(zoom - this.difficulty);
  div.style.opacity = opacity;
}


MOverlay.prototype.onRemove = function() {
  this.div_.parentNode.removeChild(this.div_);
}

// Note that the visibility property must be a string enclosed in quotes
MOverlay.prototype.hide = function() {
  if (this.div_) {
    $(this.div_).fadeOut();
  }
}

MOverlay.prototype.show = function() {
  if (this.div_) {
    $(this.div_).fadeIn();
  }
}

united.MOverlay = MOverlay;
