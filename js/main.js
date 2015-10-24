
$(document).ready(function() {

  var home = [-15.887, -66.292];
  var zoom = 6;

  var markers = [];
  var polygonFillColors = ['#F7751E', '#E612D8', '#44AB11', '#A5E62B', '#E6D62B', '#1196DE', '#F26480', '#D1C327', '#F03A2D'];
  var polygonColors = ['#F7751E', '#E612D8', '#44AB11', '#A5E62B', '#E6D62B', '#1196DE', '#F26480', '#D1C327', '#F03A2D'];

  var mapBounds, latNE = -90, lngNE = -180, latSW = 0, lngSW = 0;
  var paddingTL = [0, 90];

  var fuseDataFeatures = [];
  var fuseIndexFeatures = ['departamento', 'municipio', 'direccion'];

  var url = "<iframe width='@W' height='@H' frameBorder='0' src='@SRC'></iframe>" +
     "<p><a href='@SRC'>Ver este mapa en pantalla completa</a></p>";

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
  if (!map.restoreView()) {
    map.setView(home, zoom);
  }

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

  // Adding Share Icon
  L.easyButton({
    position: 'bottomright',
    states:[{
      icon: 'fa-share-alt',
      title: 'Compartir',
      onClick: function(){
        $("#url-share").prop('value', location);
        $("#iframe-html").html(url
          .replace(/@W/g, '960')
          .replace(/@H/g, '600')
          .replace(/@SRC/g, location.protocol + '//' + location.hostname)
        );
        $("#modal-share").modal('show');
      }
    }]
  }).addTo(map);

  /* Overlay Layers */
  function pointToLayer(feature, latlng) {
    var marker = L.marker(latlng, {
      icon: L.icon({
        iconUrl: 'img/mapicons/' + feature.properties.symbol + '.png',
        iconSize: [32, 37],
        iconAnchor: [16, 37],
        popupAnchor: [0, -37]
      }),
      title: feature.properties.institucion + " en el Municipio de " + feature.properties.municipio,
      riseOnHover: true
    });
    return marker;
  }

  function onEachFeature(feature, layer) {
    feature.layer = layer;

    var content = "";

    for (property in feature.properties) {
      var exclude = false;
      var html = "<tr>";
      var value = feature.properties[property].trim();

      switch (property) {
        case 'direccion':
          html += "<th><i class='fa fa-home'></i> Dirección</th>";
          html += "<td>" + value + "</td>";
          break;
        case 'municipio':
          html += "<th><i class='fa fa-building'></i> Municipio</th>";
          html += "<td>" + value + "</td>";
          break;
        case 'departamento':
          html += "<th><i class='fa fa-map-signs'></i> Departamento</th>";
          html += "<td>" + value + "</td>";
          break;
        case 'telefono1':
          if (value) {
            html += "<th><i class='fa fa-phone'></i> Teléfonos</th>";
            html += "<td>";
            var phones = value.split(',');
            for (var index in phones) {
              if (index > 0) { html += ', '; }
              var str = phones[index].replace(/-/gi, '').trim();
              if (str.length == 8) {
                html += "<a href='tel:+591" + str + "'>+591 " + phones[index].trim() + "</a>";
              } else {
                html += str;
              }
            }
            html += "</td>";
          }
          break;
        case 'telefono2':
          if (value) {
            html += "<th><i class='fa fa-phone'></i> Otros teléfonos</th>";
            html += "<td>";
            var phones = value.split(',');
            for (var index in phones) {
              if (index > 0) { html += ', '; }
              var str = phones[index].replace(/-/gi, '').trim();
              if (str.length == 8) {
                html += "<a href='tel:+591" + str + "'>+591 " + phones[index].trim() + "</a>";
              } else {
                html += str;
              }
            }
            html += "</td>";
          }
          break;
        case 'fax1':
          if (value) {
            html += "<th><i class='fa fa-fax'></i> Fax</th>";
            html += "<td>";
            var phones = value.split(',');
            for (var index in phones) {
              if (index > 0) { html += ', '; }
              var str = phones[index].replace(/-/gi, '').trim();
              if (str.length == 8) {
                html += "<a href='tel:+591" + str + "'>+591 " + phones[index].trim() + "</a>";
              } else {
                html += str;
              }
            }
            html += "</td>";
          }
          break;
        case 'horario':
          if (value) {
            html += "<th><i class='fa fa-clock-o'></i> Horario</th>";
            html += "<td>" + value + "</td>";
          }
          break;
        case 'paginaweb':
          if (value) {
            html += "<th><i class='fa fa-globe'></i> Página web</th>";
            html += "<td><a href='" + value + "' target='_blank'>" + value + "</a></td>";
          }
          break;
        default:
          exclude = true;
          break;
      }

      if (!exclude)
        content += html + "</tr>";
    }

    layer.on({
      click: function (e) {
        var lng = feature.geometry.coordinates[0];
        var lat = feature.geometry.coordinates[1];
        map.setView([lat, lng], 16);

        $("#feature-title").html("");
        $("#feature-desc").find('p').html("");
        $("#feature-info").find('table').html("");

        var title = feature.properties.institucion + " en el Municipio de " + feature.properties.municipio;
        if (feature.properties.nombre) {
            title += ' - ' + feature.properties.nombre;
        }
        $("#feature-title").html(title);

        if (feature.properties.info) {
          $("#feature-desc").find('p').html(feature.properties.info);
        }

        $("#feature-info").find('table').html(content);
        $("#modal-feature").modal('show');
      }
    });
  }

  function setMapBounds(latlngBounds) {

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

  function createMarkerClusterGroup(iconClass, polygonFillColor, polygonColor) {
    return L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-' + iconClass,
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: polygonFillColor,
        color: polygonColor,
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });
  }

  /* Get Data */
  $.when(
    $.getJSON("data/slim.geojson"),
    $.getJSON("data/felcv.geojson"),
    $.getJSON("data/felcc.geojson"),
    $.getJSON("data/public-ministry.geojson"),
    $.getJSON("data/fevap.geojson"),
    $.getJSON("data/idif.geojson"),
    $.getJSON("data/supreme-tribunal.geojson"),
    $.getJSON("data/judicial-district.geojson"),
    $.getJSON("data/specialized-tribunal.geojson")
  ).done(function(data1, data2, data3, data9, data4, data5, data6, data7, data8) {
    var layer;
    var countMarkers = 0;

    // data = slim
    if (data1) {
      layer = L.geoJson(data1, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[1] = createMarkerClusterGroup('poi1', polygonFillColors[0], polygonColors[0]);
      markers[1].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[1].addLayer(layer);
      map.addLayer(markers[1]);
      setMapBounds(markers[1].getBounds());

      $("#checkbox1").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data1[0].features);
    }

    // data2 = felcv
    if (data2) {
      layer = L.geoJson(data2, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[2] = createMarkerClusterGroup('poi2', polygonFillColors[1], polygonColors[1]);
      markers[2].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[2].addLayer(layer);
      map.addLayer(markers[2]);
      setMapBounds(markers[2].getBounds());

      $("#checkbox2").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data2[0].features);
    }

    // data3 = felcc
    if (data3) {
      layer = L.geoJson(data3, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[3] = createMarkerClusterGroup('poi3', polygonFillColors[2], polygonColors[2]);
      markers[3].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[3].addLayer(layer);
      map.addLayer(markers[3]);
      setMapBounds(markers[3].getBounds());

      $("#checkbox3").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data3[0].features);
    }

    // data9 = public-ministry
    if (data9) {
      layer = L.geoJson(data9, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[9] = createMarkerClusterGroup('poi9', polygonFillColors[8], polygonColors[8]);
      markers[9].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[9].addLayer(layer);
      map.addLayer(markers[9]);
      setMapBounds(markers[9].getBounds());

      $("#checkbox9").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data9[0].features);
    }

    // data4 = fevap
    if (data4) {
      layer = L.geoJson(data4, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[4] = createMarkerClusterGroup('poi4', polygonFillColors[3], polygonColors[3]);
      markers[4].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[4].addLayer(layer);
      map.addLayer(markers[4]);
      setMapBounds(markers[4].getBounds());

      $("#checkbox4").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data4[0].features);
    }

    // data5 = idif
    if (data5) {
      layer = L.geoJson(data5, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[5] = createMarkerClusterGroup('poi5', polygonFillColors[4], polygonColors[4]);
      markers[5].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[5].addLayer(layer);
      map.addLayer(markers[5]);
      setMapBounds(markers[5].getBounds());

      $("#checkbox5").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data5[0].features);
    }

    // data6 = supreme-tribunal
    if (data6) {
      layer = L.geoJson(data6, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[6] = createMarkerClusterGroup('poi6', polygonFillColors[5], polygonColors[5]);
      markers[6].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[6].addLayer(layer);
      map.addLayer(markers[6]);
      setMapBounds(markers[6].getBounds());

      $("#checkbox6").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data6[0].features);
    }

    // data7 = judicial-district
    if (data7) {
      layer = L.geoJson(data7, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[7] = createMarkerClusterGroup('poi7', polygonFillColors[6], polygonColors[6]);
      markers[7].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[7].addLayer(layer);
      map.addLayer(markers[7]);
      setMapBounds(markers[7].getBounds());

      $("#checkbox7").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data7[0].features);
    }

    // data = specialized-tribunal
    if (data8) {
      layer = L.geoJson(data8, { pointToLayer: pointToLayer, onEachFeature: onEachFeature });

      markers[8] = createMarkerClusterGroup('poi8', polygonFillColors[7], polygonColors[7]);
      markers[8].on('clusterclick', function (a) { a.layer.zoomToBounds(); });

      markers[8].addLayer(layer);
      map.addLayer(markers[8]);
      setMapBounds(markers[8].getBounds());

      $("#checkbox8").prop('checked', true);
      countMarkers++;

      fuseDataFeatures = fuseDataFeatures.concat(data8[0].features);
    }

    if (countMarkers == 9) {
      $("#cb0").prop('checked', true);
    }

    fuseSearchCtrl.indexFeatures(fuseDataFeatures, fuseIndexFeatures);

    if (!map.restoreView()) {
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    }
  });

  // Adding Fuse Search Control
  var fuseSearchCtrl = L.control.fuseSearch({
    position: 'topright',
    title: 'Buscar',
    placeholder: 'Busca tu municipio',
    threshold: 0.3,
    showInvisibleFeatures: true,
    showResultFct: function(feature, container) {
      var lng = feature.geometry.coordinates[0];
      var lat = feature.geometry.coordinates[1];
      container.setAttribute('data-marker-id', feature.layer._leaflet_id);
      container.setAttribute('data-lat', lat);
      container.setAttribute('data-lng', lng);

      container.addEventListener('click', function() {
        map.setView([lat, lng], 16);
        if (map._layers[feature.layer._leaflet_id]) {
          map._layers[feature.layer._leaflet_id].fire('click');
        }
      });

      var node = document.createElement('strong');
      node.setAttribute('class', 'title');
      var text = document.createTextNode(feature.properties.institucion);
      node.appendChild(text);
      container.appendChild(node);

      node = document.createElement('br');
      container.appendChild(node);

      text = document.createTextNode(
        feature.properties.direccion +
        ', Municipio ' + feature.properties.municipio +
        ', Departamento ' + feature.properties.departamento
      );
      container.appendChild(text);
    }
  });
  map.addControl(fuseSearchCtrl);

  /* Events */
  $("#cb0").click(function (e) {
    if ($(this).is(':checked')) {
      for (var i in markers) {
        map.addLayer(markers[i]);
      }
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
      $("input:checkbox[id^=checkbox]").prop('checked', true);
    } else {
      for (var j in markers) {
        map.removeLayer(markers[j]);
      }
      $("input:checkbox[id^=checkbox]").prop('checked', false);
    }
    $(this).prop('checked');
  });

  $("#checkbox1").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[1]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[1]);
    }
    $(this).prop('checked');
  });

  $("#checkbox2").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[2]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[2]);
    }
    $(this).prop('checked');
  });

  $("#checkbox3").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[3]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[3]);
    }
    $(this).prop('checked');
  });

  $("#checkbox9").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[9]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[9]);
    }
    $(this).prop('checked');
  });

  $("#checkbox4").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[4]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[4]);
    }
    $(this).prop('checked');
  });

  $("#checkbox5").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[5]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[5]);
    }
    $(this).prop('checked');
  });

  $("#checkbox6").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[6]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[6]);
    }
    $(this).prop('checked');
  });

  $("#checkbox7").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[7]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
     map.removeLayer(markers[7]);
    }
    $(this).prop('checked');
  });

  $("#checkbox8").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markers[8]);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markers[8]);
    }
    $(this).prop('checked');
  });

  $("input:checkbox[id^=checkbox]").change(function (e) {
    var count = 0;

    $("input:checkbox[id^=checkbox]:checked").each(function () {
      count++;
    });

    if (count == 9) {
      $("#cb0").prop('checked', true);
    } else {
      $("#cb0").prop('checked', false);
    }
  });

  $("#iframe-size").change(function(e) {
    if ($(this).val() == '1') {
      $("#iframe-width").val('960');
      $("#iframe-height").val('600');
      $("#iframe-width").attr('disabled', 'disabled');
      $("#iframe-height").attr('disabled', 'disabled');
    } else if ($(this).val() == '2') {
      $("#iframe-width").val('800');
      $("#iframe-height").val('600');
      $("#iframe-width").attr('disabled', 'disabled');
      $("#iframe-height").attr('disabled', 'disabled');
    } else if ($(this).val() == '3') {
      $("#iframe-width").val('600');
      $("#iframe-height").val('600');
      $("#iframe-width").attr('disabled', 'disabled');
      $("#iframe-height").attr('disabled', 'disabled');
    } else if ($(this).val() == '4') {
      $("#iframe-width").removeAttr('disabled');
      $("#iframe-height").removeAttr('disabled');
      $("#iframe-width").focus();
    }

    $("#iframe-html").html(url
      .replace(/@W/g, $("#iframe-width").val())
      .replace(/@H/g, $("#iframe-height").val())
      .replace(/@SRC/g, location.protocol + '//' + location.hostname)
    );
  });

  $("#iframe-width").change(function(e) {
    $("#iframe-html").html(url
      .replace(/@W/g, $("#iframe-width").val())
      .replace(/@H/g, $("#iframe-height").val())
      .replace(/@SRC/g, location.protocol + '//' + location.hostname)
    );
  });

  $("#iframe-height").change(function(e) {
    $("#iframe-html").html(url
      .replace(/@W/g, $("#iframe-width").val())
      .replace(/@H/g, $("#iframe-height").val())
      .replace(/@SRC/g, location.protocol + '//' + location.hostname)
    );
  });

});
