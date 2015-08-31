
// config tiles services
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
