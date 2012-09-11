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

function initialize() {
    geocoder = new google.maps.Geocoder();
    var map_options = {
        center: new google.maps.LatLng(pin.lat, pin.long),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var google_map = new google.maps.Map(document.getElementById("map_canvas"), map_options);

    var info_window = new google.maps.InfoWindow({
        content: 'loading'
    });
/*    var m = new google.maps.Marker({
        map: google_map,
        animation: google.maps.Animation.DROP,
        title: pin.title,
        position: new google.maps.LatLng(pin.lat, pin.lng),
        html: pin.msg
    });
    console.log(m)
    google.maps.event.addListener(m, 'click', function() {
        info_window.setContent(this.html);
        info_window.open(google_map, this);
    });
    console.log("what is going on") */

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
      }
    });


}
