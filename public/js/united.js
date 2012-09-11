var t = [];
var x = [];
var y = [];
var h = [];
var nav = null;
var pin = {
    lat: null,
    lng: null
}

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
    pin.lng = position.coords.longitude;

    initialize();

}

function initialize() {

    var map_options = {
        center: new google.maps.LatLng(pin.lat, pin.lng),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    var google_map = new google.maps.Map(document.getElementById("map_canvas"), map_options);

    var info_window = new google.maps.InfoWindow({
        content: 'loading'
    });
    pin.title = "test"
    pin.msg = "hello"
    var m = new google.maps.Marker({
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
    console.log("what is going on")
    var i = 0;
    for (item in t) {

        i++;
    }
}
