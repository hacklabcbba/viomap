
$(document).ready(function() {

  var markersSlim, markersFELCV, markersFELCC, markersPM, markersFEVAP, markersIDIF, markersSUT, markersJUD, markersSPT;
  var mapBounds, latNE = -90, lngNE = -180, latSW = 0, lngSW = 0;
  var paddingTL = [0, $(window).width() >= 768 ? 120 : 60];
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

  var fuseIndexFeatures = ['departamento', 'municipio', 'direccion'];

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
          html += "<th><i class='fa fa-map-signs'></i> Dirección</th>";
          html += "<td>" + value + "</td>";
          break;
        case 'municipio':
          html += "<th><i class='fa fa-map-signs'></i> Municipio</th>";
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
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#F7751E',
        color: '#F7751E',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersSlim.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersSlim.addLayer(layer);
    map.addLayer(markersSlim);
    setMapBounds(markersSlim.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox1").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
  });

  $.getJSON("data/felcv.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersFELCV = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-2',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#E612D8',
        color: '#E612D8',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersFELCV.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersFELCV.addLayer(layer);
    map.addLayer(markersFELCV);
    setMapBounds(markersFELCV.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox2").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
  });

  $.getJSON("data/felcc.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersFELCC = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-3',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#44AB11',
        color: '#44AB11',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersFELCC.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersFELCC.addLayer(layer);
    map.addLayer(markersFELCC);
    setMapBounds(markersFELCC.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox3").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
  });

  $.getJSON("data/public-ministry.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersPM = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-9',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#F03A2D',
        color: '#F03A2D',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersPM.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersPM.addLayer(layer);
    map.addLayer(markersPM);
    setMapBounds(markersPM.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox9").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
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
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#A5E62B',
        color: '#A5E62B',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersFEVAP.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersFEVAP.addLayer(layer);
    map.addLayer(markersFEVAP);
    setMapBounds(markersFEVAP.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox4").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
  });

  $.getJSON("data/idif.geojson", function (data) {
    var layer = L.geoJson(data, {
      pointToLayer: pointToLayer,
      onEachFeature: onEachFeature
    });

    markersIDIF = L.markerClusterGroup({
      iconCreateFunction: function (cluster) {
        return new L.DivIcon({
          html: '<div><span>' + cluster.getChildCount() + '</span></div>',
          className: 'marker-cluster marker-cluster-poi-5',
          iconSize: new L.Point(40, 40)
        });
      },
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#E6D62B',
        color: '#E6D62B',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersIDIF.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersIDIF.addLayer(layer);
    map.addLayer(markersIDIF);
    setMapBounds(markersIDIF.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox5").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
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
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#1196DE',
        color: '#1196DE',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersSUT.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersSUT.addLayer(layer);
    map.addLayer(markersSUT);
    setMapBounds(markersSUT.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox6").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
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
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#F26480',
        color: '#F26480',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersJUD.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersJUD.addLayer(layer);
    map.addLayer(markersJUD);
    setMapBounds(markersJUD.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox7").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
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
      zoomToBoundsOnClick: false,
      polygonOptions: {
        fillColor: '#D1C327',
        color: '#D1C327',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.5
      }
    });

    markersSPT.on('clusterclick', function (a) {
      a.layer.zoomToBounds();
    });

    markersSPT.addLayer(layer);
    map.addLayer(markersSPT);
    setMapBounds(markersSPT.getBounds());
    map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });

    $("#checkbox8").prop('checked', true);

    fuseSearchCtrl.indexFeatures(data, fuseIndexFeatures);
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

  $("#checkbox2").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersFELCV);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersFELCV);
    }
    $(this).prop('checked');
  });

  $("#checkbox3").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersFELCC);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersFELCC);
    }
    $(this).prop('checked');
  });

  $("#checkbox9").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersPM);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersPM);
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

  $("#checkbox5").change(function (e) {
    if ($(this).is(':checked')) {
      map.addLayer(markersIDIF);
      map.fitBounds(mapBounds, { paddingTopLeft: paddingTL });
    } else {
      map.removeLayer(markersIDIF);
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
