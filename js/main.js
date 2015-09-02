
/* Basemap Layers */
var tileLayerData = {
  mapsurfer: {
    name: 'OpenMapSurfer',
    url: 'http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}',
    attribution: '<a href="http://giscience.uni-hd.de/" target="_blank">GIScience</a>',
    zoom: 19,
    default: true
  },
  satellite: {
    name: 'Satellite',
    url: 'http://{s}.tiles.mapbox.com/v3/51114u9.kogin3jb/{z}/{x}/{y}.png',
    attribution: '<a href="http://mapbox.com/" target="_blank">MapBox</a>',
    zoom: 17
  },
  hotosm: {
    name: 'Humanitarian',
    url: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '<a href="http://hot.openstreetmap.org/" target="_blank">HOT Team</a>',
    zoom: 20
  },
  osmfr: {
    name: 'OSM France',
    url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '<a href="http://openstreetmap.fr/" target="_blank">OSM France</a>',
    zoom: 20
  },
  transport: {
    name: 'Public Transport',
    url: 'http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png',
    attribution: '<a href="http://thunderforest.com/transport/" target="_blank">ThunderForest</a>',
    zoom: 20
  }
};

var attribution = 'Map data &#169; <a href="http://osm.org/copyright" target="_blank">OpenStreetMap</a> contributors';

var tileLayers = {};
var tileLayerDefault = '';

for (tile in tileLayerData) {
  if (0 == tileLayerDefault.length)
    tileLayerDefault = tileLayerData[tile].name;
  if (tileLayerData[tile].default)
    tileLayerDefault = tileLayerData[tile].name;

  var tileAttribution = attribution + ' &mdash; ' + 'Tiles from ' + tileLayerData[tile].attribution;
  var tileSubDomains = tileLayerData[tile].subdomains ? tileLayerData[tile].subdomains : 'abc';
  var tileMaxZoom = tileLayerData[tile].zoom;

  tileLayers[tileLayerData[tile].name] = L.tileLayer(
    tileLayerData[tile].url, {
      maxZoom: 20,
      maxNativeZoom: tileMaxZoom,
      attribution: tileAttribution,
      subdomains: tileSubDomains
  });
}

// Initialize map
var map = new L.Map('map', {
  zoomControl: false
});

// Adding layer functionality
tileLayers[tileLayerDefault].addTo(map);
L.control.layers(tileLayers).addTo(map);
map.setView([-15.887, -66.292], 6);

// Adding hash for position in url
var hash = new L.Hash(map);

// Adding zoom control
var zoomControl = L.control.zoom({
  position: 'bottomright'
}).addTo(map);

// Adding location control
L.control.locate({
  position: 'bottomright',
  follow: false,
  setView: true,
  keepCurrentZoomLevel: false,
  stopFollowingOnDrag: true,
  icon: 'fa fa-location-arrow',
  iconLoading: 'fa fa-spinner fa-spin',
  onLocationError: function(err) {alert("Sorry. There was an error when trying to locate your location.")},
  showPopup: true,
  strings: {
    title: "Show me where I am",
    metersUnit: "meters",
    feetUnit: "feet",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: { maxZoom: 16 }
}).addTo(map);

/* Overlay Layers */
var slims = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "img/mapicons/office-building_poi.png",
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -37]
      }),
      title: feature.properties.institucion,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    var content =
      "<tr><th data-l10n-id='marker_address'><i class='fa fa-map-signs'></i> Address</th><td>" + feature.properties.direccion + ", " + feature.properties.municipio + ", " + feature.properties.departamento + "</td></tr>" +
      "<tr><th data-l10n-id='marker_phone1'><i class='fa fa-phone'></i> Phones</th><td>" + feature.properties.telefonos + "</td></tr>" +
      "<tr><th data-l10n-id='marker_phone2'><i class='fa fa-phone'></i> Other Phones</th><td>" + feature.properties.telefonos2 + "</td></tr>";
    layer.on({
      click: function (e) {
        $("#feature-title").html(feature.properties.institucion);
        $("#feature-info").find("table").html(content);
        $("#featureModal").modal("show");
      }
    });
  }
}).addTo(map);
$.getJSON("data/slims.geojson", function (data) {
  slims.addData(data);
});

var fevaps = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "img/mapicons/bigcity_poi.png",
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -37]
      }),
      title: feature.properties.institucion,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    var content =
      "<tr><th data-l10n-id='marker_address'><i class='fa fa-map-signs'></i> Address</th><td>" + feature.properties.direccion + ", " + feature.properties.municipio + ", " + feature.properties.departamento + "</td></tr>" +
      "<tr><th data-l10n-id='marker_phone1'><i class='fa fa-phone'></i> Phones</th><td>" + feature.properties.telefono + "</td></tr>" +
      "<tr><th data-l10n-id='marker_openinghours'><i class='fa fa-clock-o'></i> Opening Hours</th><td>" + feature.properties.horario + "</td></tr>" +
      "<tr><th data-l10n-id='marker_website'><i class='fa fa-globe'></i> Web Site</th><td>" + feature.properties.sitioweb + "</td></tr>";
    layer.on({
      click: function (e) {
        $("#feature-title").html(feature.properties.institucion);
        $("#feature-info").find("table").html(content);
        $("#featureModal").modal("show");
      }
    });
  }
}).addTo(map);
$.getJSON("data/fevaps.geojson", function (data) {
  fevaps.addData(data);
});
