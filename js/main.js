
$(document).ready(function() {

  var markersSlim, markersFELCV, markersFELCC, markersFEVAP, markersIDIF, markersSUT, markersJUD, markersSPT;
  var mapBounds, latNE = -90, lngNE = -180, latSW = 0, lngSW = 0;
  var paddingTL = [0, $(window).width() >= 768 ? 120 : 60];

  /* ToolTip */
  $("[data-toggle='tooltip']").tooltip();

  /* Basemap Layers */
  var tileLayerData = {
    mapsurfer: {
      name: 'OpenMapSurfer',
      url: 'http://openmapsurfer.uni-hd.de/tiles/roads/x={x}&y={y}&z={z}',
      attribution: '<a href="http://giscience.uni-hd.de/" target="_blank">GIScience</a>',
      zoom: 19
    },
    satellite: {
      name: 'Fotos satelitales',
      url: 'http://{s}.tiles.mapbox.com/v3/51114u9.kogin3jb/{z}/{x}/{y}.png',
      attribution: '<a href="http://mapbox.com/" target="_blank">MapBox</a>',
      zoom: 17
    },
    hotosm: {
      name: 'Estilo humanitario',
      url: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      attribution: '<a href="http://hot.openstreetmap.org/" target="_blank">Equipo HOT</a>',
      zoom: 20,
      default: true
    },
    osmfr: {
      name: 'Estilo francés',
      url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      attribution: '<a href="http://openstreetmap.fr/" target="_blank">OSM Francia</a>',
      zoom: 20
    },
    transport: {
      name: 'Transporte público',
      url: 'http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png',
      attribution: '<a href="http://thunderforest.com/transport/" target="_blank">ThunderForest</a>',
      zoom: 20
    }
  };

  var attribution = 'Datos &#169; contribuidores <a href="http://osm.org/copyright" target="_blank">OpenStreetMap</a>';

  var tileLayers = {};
  var tileLayerDefault = '';

  for (tile in tileLayerData) {
    if (0 == tileLayerDefault.length)
      tileLayerDefault = tileLayerData[tile].name;
    if (tileLayerData[tile].default)
      tileLayerDefault = tileLayerData[tile].name;

    var tileAttribution = attribution + ' &mdash; ' + 'Teselas ' + tileLayerData[tile].attribution;
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
    onLocationError: function(err) {alert("Lo sentimos. Se produjo un error al intentar localizar su ubicación.")},
    showPopup: true,
    strings: {
      title: "Le muestra dónde esta",
      metersUnit: "metros",
      feetUnit: "pies",
      popup: "Está a {distance} {unit} de éste punto",
      outsideMapBoundsMsg: "Parece que se encuentra fuera de los límites del mapa"
    },
    locateOptions: { maxZoom: 16 }
  }).addTo(map);

  /* Overlay Layers */
  function pointToLayer (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: 'img/mapicons/' + feature.properties.symbol + '_poi.png',
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -37]
      }),
      title: feature.properties.institucion + " de " + feature.properties.municipio,
      riseOnHover: true
    });
  }

  function onEachFeature (feature, layer) {

    var content = "";

    for (property in feature.properties) {

      var exclude = false;
      var html = "<tr>";

      switch (property) {
        case 'direccion':
          html += "<th data-l10n-id='marker_address'><i class='fa fa-map-signs'></i> Dirección</th>";
          break;
        case 'municipio':
          html += "<th data-l10n-id='marker_municipality'><i class='fa fa-map-signs'></i> Municipio</th>";
          break;
        case 'departamento':
          html += "<th data-l10n-id='marker_state'><i class='fa fa-map-signs'></i> Departamento</th>";
          break;
        case 'telefono1':
          html += "<th data-l10n-id='marker_phone1'><i class='fa fa-phone'></i> Teléfonos</th>";
          break;
        case 'telefono2':
          html += "<th data-l10n-id='marker_phone2'><i class='fa fa-phone'></i> Otros teléfonos</th>";
          break;
        case 'fax1':
          html += "<th data-l10n-id='marker_fax1'><i class='fa fa-fax'></i> Fax</th>";
          break;
        case 'horario':
          html += "<th data-l10n-id='marker_openinghours'><i class='fa fa-clock-o'></i> Horario de atención</th>";
          break;
        case 'paginaweb':
          html += "<th data-l10n-id='marker_website'><i class='fa fa-globe'></i> Página web</th>";
          break;
        default:
          exclude = true;
          break;
      }

      if (!exclude)
        content += html + "<td>" + feature.properties[property] + "</td></tr>";
    }

    layer.on({
      click: function (e) {
        var lng = feature.geometry.coordinates[0];
        var lat = feature.geometry.coordinates[1];
        map.setView([lat, lng], 16);

        $("#feature-title").html(feature.properties.institucion + " de " + feature.properties.municipio);
        $("#feature-info").find('table').html(content);
        $("#modal-feature").modal('show');
      }
    });
  }

  function setMapBounds (latlngBounds) {

    if (latlngBounds.getNorthEast().lat > latNE)
      latNE = latlngBounds.getNorthEast().lat;
    if (latlngBounds.getNorthEast().lng > lngNE)
      lngNE = latlngBounds.getNorthEast().lng;

    if (latlngBounds.getSouthWest().lat < latSW)
      latSW = latlngBounds.getSouthWest().lat;
    if (latlngBounds.getSouthWest().lng < lngSW)
      lngSW = latlngBounds.getSouthWest().lng;

    mapBounds = L.latLngBounds(L.latLng(latSW,lngSW), L.latLng(latNE,lngNE));
  }

  /* Get Data */
  $.getJSON("data/slim.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersSlim = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-1',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false
    });

    markersSlim.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersSlim.addLayer(layer);
    map.addLayer(markersSlim);
    setMapBounds(markersSlim.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox1").prop('checked', true);
  });

  $.getJSON("data/fevap.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersFEVAP = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-4',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false
    });

    markersFEVAP.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersFEVAP.addLayer(layer);
    map.addLayer(markersFEVAP);
    setMapBounds(markersFEVAP.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox4").prop('checked', true);
  });

  $.getJSON("data/supreme-tribunal.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersSUT = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-6',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false
    });

    markersSUT.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersSUT.addLayer(layer);
    map.addLayer(markersSUT);
    setMapBounds(markersSUT.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox6").prop('checked', true);
  });

  $.getJSON("data/judicial-district.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersJUD = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-7',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false
    });

    markersJUD.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersJUD.addLayer(layer);
    map.addLayer(markersJUD);
    setMapBounds(markersJUD.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox7").prop('checked', true);
  });

  $.getJSON("data/specialized-tribunal.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersSPT = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-8',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false
    });

    markersSPT.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersSPT.addLayer(layer);
    map.addLayer(markersSPT);
    setMapBounds(markersSPT.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox8").prop('checked', true);
  });

  /* Events */
  $("#checkbox1").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersSlim);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersSlim);
    }
    $(this).prop('checked');
  });

  $("#checkbox4").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersFEVAP);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersFEVAP);
    }
    $(this).prop('checked');
  });

  $("#checkbox6").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersSUT);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersSUT);
    }
    $(this).prop('checked');
  });

  $("#checkbox7").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersJUD);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
     map.removeLayer(markersJUD);
    }
    $(this).prop('checked');
  });

  $("#checkbox8").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersSPT);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersSPT);
    }
    $(this).prop('checked');
  });

});
