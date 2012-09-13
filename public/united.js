
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
    lng: null
};

function requestPosition(cb) {
    if (nav == null) {
        nav = window.navigator;
    }
    if (nav != null) {
        var geoloc = nav.geolocation;
        if (geoloc != null) {
            geoloc.getCurrentPosition(function(position){
              successCallback(position, cb);
            }, function(error){
              successCallback(null, cb);
            });
        }
    } else {
      successCallback(null, cb);
    }
}



function successCallback(position, cb) {
    if (position !== null) {
      pin.lat = position.coords.latitude;
      pin.lng = position.coords.longitude;
    }
    cb(initialize());
}

function placeOverlayAt(opts) {
  var map = opts.map;
  var lat = opts.lat;
  var lng = opts.lng;
  var eggId = opts.eggId;
  var scale = opts.scale || 1;
  var difficulty = opts.difficulty || 11;

  var hw = 0.004 * scale;
  var hh = 0.0031 * scale;
  var swBound = new google.maps.LatLng(lat - hw, lng - hh);
  var neBound = new google.maps.LatLng(lat + hw, lng + hh);
  var bounds = new google.maps.LatLngBounds(swBound, neBound);

  var srcImage = '/img/monstercat_findme.png';
  overlay = new MOverlay(bounds, srcImage, map, difficulty, opts);

  function on(evt, cb) {
    google.maps.event.addListener(map, evt, cb);
  }

  function shouldShow() {
    var zoom = map.getZoom();
    return zoom > 8 && bounds.intersects(map.getBounds());
  }

  function showOrHide() {
    var center = map.getCenter();
    if (shouldShow()) {
      overlay.show();
    } else {
      overlay.hide();
    }
  }

  var $modal = $("#catModal");


  on('zoom_changed', showOrHide);
  on('center_changed', showOrHide);
  on('added_cat', function(div, opts_){
    $(div).click(function(){
      $modal.modal();
      $("#modalEggId", $modal).val(opts_.eggId);
      $("#modalMsg",   $modal).text(opts_.message || "");
    });
  });

  $(".submit-cat", $modal).click(function(){
    if ($("#modalEggId", $modal).val() !== opts.eggId)
      return;
    var name = $("#contestName", $modal).val();
    var email = $("#email", $modal).val();

    if (name === "" || email === "") {
      alert("Please fill in both fields");
      return;
    }

    $.ajax({
      type: 'POST',
      url: '/found',
      data: {
        name: name,
        email: email,
        eggId: opts.eggId,
        claimedAt: new Date()
      },
      success: function(){
        $modal.modal('hide');
      },
      error: function(){
        alert("This has already been claimed, sorry :(");
        $modal.modal('hide');
      }
    });
  });
}

function initialize() {
  geocoder = new google.maps.Geocoder();
  var lat = 39.49;
  var lng = -99.62;
  var zoom = 4;

  if (pin.lat !== null && pin.lng !== null) {
    lat = pin.lat;
    lng = pin.lng;
    zoom = 10;
  }

  var map_options = {
      center: new google.maps.LatLng(lat, lng),
      zoom: zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(document.getElementById("map_canvas"), map_options);

  var overlays = [
    { map: map, lat: 29.975309, lng: 31.137751, eggId: 'a', difficulty: 10,
      message: "The original Monstercat."
    },
    { map: map, lat: 61.502224, lng: 23.71985, eggId: 'b', difficulty: 9,
      message: "Oldest operational Sauna in Finland!"
    },
    { map: map, lat: 35.50936, lng: -105.918694, eggId: 'c', difficulty: 9,
      message: ""
    },
    { map: map, lat: 27.9856, lng: 86.9233, eggId: 'd', difficulty: 10,
      message: "#OperationDethrone"
    },
    { map: map, lat: -19.39, lng: 46.64, eggId: 'e', difficulty: 9,
      message: "You have found the secret Monstercat. SHUT. DOWN. EVERYTHING.",
      scale: 8
    }
  ];

  $.ajax({
    type: "GET",
    url: "/found",
    success: function(claimed){
      var nonClaimedOverlays = _(overlays).filter(function(overlay){
        return !_(claimed).include(overlay.eggId);
      });
      _(nonClaimedOverlays).each(placeOverlayAt);
    }
  });

  var info_window = new google.maps.InfoWindow({
      content: 'loading'
  });

  var pins = null;
  $.ajax({
    type: "GET",
    url: "pins",

    success: function(data) {
      var pins = data.results;
      for(var i = 0; i < pins.length; i++){
        var pin = pins[i];
        var cookie = $.cookie("unitedMarker");
        if( cookie === pin._id ){
          map.panTo(new google.maps.LatLng(pin.lat, pin.lng));
        }
        placePin(pin, map, info_window);
      }
    }
  });
  return { map: map, info_window: info_window };
}

function placePin(pin, map, info_window){
  var r = Math.random() / 18;
  var m = new google.maps.Marker({
    map: map,
    animation: google.maps.Animation.DROP,
    title: pin.name,
    position: new google.maps.LatLng(pin.lat + r, pin.lng + r),
    html: "<p><strong>"+ pin.message +"</strong></p><br/><strong><i> - "+ pin.name +"</i></strong></footer>"
  });
  google.maps.event.addListener(m, 'click', (function(m) {
    return function(){
      info_window.setContent(m.html);
      info_window.open(map, m);
    }
  })(m));
}

function validate(event){
    var input = null;
    var val = null;
    var err;
    input = $("#name")
    if(input.val() === "" || input.val().length < 2){
      input.closest('.control-group').addClass('error');

      return false
    }
    pin.name = input.val()

    input = $("#location")
    if(input.val() === "" || input.val().length < 2) {
      input.closest('.control-group').addClass('error');
      return false;
    }
    pin.location = input.val()

    input = $("#msg")
    if(input.val() === "" || input.val().length <= 1 || input.val().length > 140){
      input.closest('.control-group').addClass('error');
      return false;
    }
    pin.message = input.val()

    lat = $("#lat");
    lng = $("#lng");
    if(lat.val() === "" && lng.val() === "" ){
      var address = $("#location").val();

      geocoder.geocode({"address": address}, function(res, status){
        if(status === google.maps.GeocoderStatus.OK){
          pin.lat = res[0].geometry.location.Xa;
          pin.lng = res[0].geometry.location.Ya;
        }
        else {
          return false
          // use html5 geo api
        }
      });
    }
    pin.lat = lat.val();
    pin.lng = lng.val();

    pin.recaptcha_challenge_field = Recaptcha.get_challenge()
    pin.recaptcha_response_field = Recaptcha.get_response()
    $.ajax({
      type: "POST",
      url: "",
      data: pin,
      success: function() {
        $("#form").slideUp();
        placePin(pin, event.data.map, event.data.info_window);
        event.data.map.panTo(new google.maps.LatLng(pin.lat, pin.lng));
        Recaptcha.destroy()
      },
      error: function(fail) {
        var ret = JSON.parse(fail.responseText);
        Recaptcha.reload();
        $("#form-err").show()
        $("#form-err").append("<strong>Error!</strong> "+ ret.err)
      }
    });
}

//
// MOverlay
//
function MOverlay(bounds, image, map, difficulty, opts) {

  this.ratio = 160 / 212;
  this.difficulty = difficulty || 11;

  this.opts = opts;

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
  var $div = $(div);
  div.style.border = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';
  div.style.cursor = 'pointer';

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

  google.maps.event.trigger(this.map_, 'added_cat', div, this.opts);
}

function sigmoid(t) {
  var e = 2.71828182846;
  return 1 / (1 + Math.pow(e, -t));
}

MOverlay.prototype.draw = function() {
  if (!this.div_) return;
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


MOverlay.prototype.remove = function() {
  if (this.div_ && this.div_.parentNode) {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
}

MOverlay.prototype.onRemove = function() {
  this.remove();
}

// Note that the visibility property must be a string enclosed in quotes
MOverlay.prototype.hide = function() {
  if (this.div_) {
    this.onRemove();
  }
}

MOverlay.prototype.show = function() {
  if (!this.div_) {
    this.onAdd();
    this.draw();
  }
}

united.MOverlay = MOverlay;
