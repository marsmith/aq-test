// ------------------------------------------------------------------------------
// ----- Aquifer Test Locator ----------------------------------------------------------
// ------------------------------------------------------------------------------

// copyright:   2018 Martyn Smith - USGS NY WSC

// authors:  Martyn J. Smith - USGS NY WSC

// purpose:  Web Mapping interface for Aquifer Test System

// updates:
// 03.15.2018 mjs - Created

//CSS imports
import 'bootstrap/dist/css/bootstrap.css';
import 'font-awesome/css/font-awesome.css';
import 'leaflet/dist/leaflet.css';
import 'marker-creator/stylesheets/markers.css';
// COMMENT OUT FOR NOW:
// https://github.com/Leaflet/Leaflet.markercluster/issues/874
// import 'leaflet.markercluster/dist/MarkerCluster.css';
// import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'select2/dist/css/select2.css';
import './styles/main.css';

//JS imports
import 'bootstrap/js/dist/util';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/collapse';
import 'bootstrap/js/dist/tab';
import 'select2';
// import 'leaflet.markercluster';
import { map, control, tileLayer, featureGroup, geoJSON, Icon } from 'leaflet';
import { basemapLayer, featureLayer } from 'esri-leaflet';

//START user config variables
var MapX = '-76.2'; //set initial map longitude
var MapY = '42.7'; //set initial map latitude
var MapZoom = 7; //set initial map zoom
var hydraulicsFile = './hydraulics.subf.subf';  //input RDB file
var scienceBaseRootURL = 'https://www.sciencebase.gov';
var scienceBaseItem = '5ab3d31be4b081f61ab5e3b3';
//END user config variables 

//global variables
var theMap;
var featureCollection;
var layer, sitesLayer, layerLabels;
var scienceBaseItems = {};

var codeLookup = {
  'C001': 'Site ID (station number)',
  'C012': 'Local well number',
  'C909': 'Latitude NAD83 in decimal degrees',
  'C910': 'Longitude NAD83 in decimal degrees',
  'C098': 'Test type',
  'C099': 'Test start date',
  'C296': 'Test end date',
  'C297': 'Test end time',
  'C502': 'Test start time datum',
  'C731': 'Record type in TEST file',
  'C790': 'Test Start Time',
  'C110': 'Storage coefficient',
  'C487': 'Test type',
  'C488': 'Test start date',
  'C489': 'Test Start Time',
  'C732': 'Record type in TEST file',
  'C743': 'Test method code',
  'C744': 'Test data type',
  'C105': 'Result value',
  'C150': 'Discharge',
  'C148': 'Date discharge measured',
  'C500': 'Related site station number',
  'C100': 'Aquifer',
  'C101': 'Top of interval (ft)',
  'C102': 'Bottom of interval (ft)'
}

var resultsLookup = {
  'PUMP.RT': 'Pumping Rate (gal/min)',
  'PUMP.DURATION': 'Duration of pumping (hr)',
  'SPEC.CAP': 'Specific Capacity (gal/min)/ft',
  'TRANSMISS': 'Transmissivity (ft&#178/d)',
  'SAT.HORZ.COND': 'Hydraulic conductivity (ft/d)',
  'STOR.COEF': 'Storage coefficient',
}

var iconLookup = {
  'Unknown': 'wmm-pin wmm-mutedblue wmm-icon-circle wmm-icon-white wmm-size-25',
  'Slug Test': 'wmm-pin wmm-blue wmm-icon-circle wmm-icon-white wmm-size-25',
  'Multi-Well Aquifer Test': 'wmm-pin wmm-purple wmm-icon-circle wmm-icon-white wmm-size-25',
  'Single-Well Aquifer Test': 'wmm-pin wmm-orange wmm-icon-circle wmm-icon-white wmm-size-25',
  'Specific-Capacity Test': 'wmm-pin wmm-mutedred wmm-icon-circle wmm-icon-white wmm-size-25',
}

var testMethodLookup = {
  'AQA01': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush Thomas anisotropy'
  },
  'AQA02': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush anisotropy'
  },
  'AQA03': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Maslia Randolph anisotropy'
  },
  'AQA04': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Newman anisotropy'
  },
  'AQA05': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Papadopulos anisotrpy'
  },
  'AQA06': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Glover Moody anisotropy'
  },
  'AQA07': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench anis unconfined'
  },
  'AQB01': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Clark barometric efficiency'
  },
  'AQD03': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Darcy lab constant head'
  },
  'AQG01': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Hazen'
  },
  'AQG02': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Slichter'
  },
  'AQG03': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Kozeny'
  },
  'AQG04': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Alyamani Sen'
  },
  'AQG05': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Beyer'
  },
  'AQG06': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Terzaghi'
  },
  'AQG07': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Kruger'
  },
  'AQG08': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Sauerbrei'
  },
  'AQG09': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'USBR'
  },
  'AQG10': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Zunker'
  },
  'AQG11': {
    'testType': 'Grain-Size Distribution',
    'testExplanation': 'Zamarin'
  },
  'AQI01': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Ferris image confined'
  },
  'AQI02': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Ferris image unconfined'
  },
  'AQM01': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Neuman leaky'
  },
  'AQM02': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Cooper straight'
  },
  'AQM03': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Theis confined'
  },
  'AQM04': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Chow confined'
  },
  'AQM05': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush dist dd confined'
  },
  'AQM06': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Theim dist dd unconfined'
  },
  'AQM07': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench dual porosity'
  },
  'AQM08': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush leaky'
  },
  'AQM09': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush leaky'
  },
  'AQM10': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush leaky2'
  },
  'AQM11': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Walton leaky'
  },
  'AQM12': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'MODFLOW'
  },
  'AQM13': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'SUTRA'
  },
  'AQM14': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Boulton unconf delayed yield'
  },
  'AQM15': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench unconfined'
  },
  'AQM16': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Neuman unconfined'
  },
  'AQM17': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Neuman unconf part penetr'
  },
  'AQM18': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Theis Jacob unconfined'
  },
  'AQM19': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench part penetr unconf'
  },
  'AQM20': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Dagan unconfined'
  },
  'AQM21': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Prickett unconfined'
  },
  'AQM22': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench large diam leaky'
  },
  'AQM23': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Quick Neuman unconfined'
  },
  'AQM24': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Gringarten fract flow'
  },
  'AQM25': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Dougherty confined'
  },
  'AQM26': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench leaky'
  },
  'AQM27': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Murdoch confined'
  },
  'AQM28': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush confined'
  },
  'AQM29': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Barker confined'
  },
  'AQM30': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Hantush leaky'
  },
  'AQM31': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Cooley leaky'
  },
  'AQM32': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Butler confined'
  },
  'AQM33': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Moench confined'
  },
  'AQM34': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Neuman leaky'
  },
  'AQM35': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Barker fracture flow'
  },
  'AQM36': {
    'testType': 'Multi-Well Aquifer Test',
    'testExplanation': 'Cooper unconfined'
  },
  'AQR01': {
    'testType': 'Recovery Test',
    'testExplanation': 'Cooper Jacob'
  },
  'AQR02': {
    'testType': 'Recovery Test',
    'testExplanation': 'Theis'
  },
  'AQR03': {
    'testType': 'Recovery Test',
    'testExplanation': 'Moench'
  },
  'AQS01': {
    'testType': 'Slug Test',
    'testExplanation': 'Bouwer Rice'
  },
  'AQS02': {
    'testType': 'Slug Test',
    'testExplanation': 'Butler Garnett'
  },
  'AQS03': {
    'testType': 'Slug Test',
    'testExplanation': 'Cooper Brede Papa'
  },
  'AQS04': {
    'testType': 'Slug Test',
    'testExplanation': 'Hvorslev'
  },
  'AQS05': {
    'testType': 'Slug Test',
    'testExplanation': 'Vanderkamp underdamped'
  },
  'AQS06': {
    'testType': 'Slug Test',
    'testExplanation': 'Ferris Knowles'
  },
  'AQS07': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Cooper Jacob'
  },
  'AQS08': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Theis'
  },
  'AQS09': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Jacob Lohman flowing'
  },
  'AQS10': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Hantush flowing leaky'
  },
  'AQS11': {
    'testType': 'Specific-Capacity Test',
    'testExplanation': 'Brown confined'
  },
  'AQS12': {
    'testType': 'Specific-Capacity Test',
    'testExplanation': 'Driscoll confined'
  },
  'AQS13': {
    'testType': 'Specific-Capacity Test',
    'testExplanation': 'Driscoll unconfined'
  },
  'AQS14': {
    'testType': 'Specific-Capacity Test',
    'testExplanation': 'Theis unconfined'
  },
  'AQS15': {
    'testType': 'Step Test',
    'testExplanation': 'Driscoll'
  },
  'AQS16': {
    'testType': 'Step Test',
    'testExplanation': 'Rorabaugh'
  },
  'AQS17': {
    'testType': 'Flow Log',
    'testExplanation': 'Day-Lewis FLASH'
  },
  'AQS18': {
    'testType': 'Flow Log',
    'testExplanation': 'Halford Analyze Hole'
  },
  'AQS19': {
    'testType': 'Slug Test',
    'testExplanation': 'Dougherty'
  },
  'AQS20': {
    'testType': 'Slug Test',
    'testExplanation': 'Hyder'
  },
  'AQS21': {
    'testType': 'Slug Test',
    'testExplanation': 'Butler slug test'
  },
  'AQS22': {
    'testType': 'Slug Test',
    'testExplanation': 'Peres slug test'
  },
  'AQS23': {
    'testType': 'Slug Test',
    'testExplanation': 'McElwee slug test'
  },
  'AQS24': {
    'testType': 'Slug Test',
    'testExplanation': 'Dagan slug test'
  },
  'AQS25': {
    'testType': 'Slug Test',
    'testExplanation': 'Springer slug test'
  },
  'AQS26': {
    'testType': 'Slug Test',
    'testExplanation': 'Barker slug test'
  },
  'AQS27': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Hurst flowing'
  },
  'AQS28': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Barker flowing'
  },
  'AQS29': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Ozkan flowing'
  },
  'AQS30': {
    'testType': 'Single-Well Aquifer Test',
    'testExplanation': 'Moench flowing'
  },
  'AQS31': {
    'testType': 'Step Test',
    'testExplanation': 'Dougherty'
  },
  'AQS32': {
    'testType': 'Step Test',
    'testExplanation': 'Hantush'
  },
  'AQW01': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Ferris WL fluc'
  },
  'AQW02': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Hsieh Brede Farr earth tide'
  },
  'AQW03': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Jiao Tang tidal fluctuation'
  },
  'AQW04': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Rhoads Robin tidal fluc'
  },
  'AQW05': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Ritzi Soroos Hsieh atmos tides'
  },
  'AQW06': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Pinder Brede Cooper diffusivity'
  },
  'AQW07': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Stallman Papa diffusivity'
  },
  'AQW08': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Rorabaugh WL fluctuation'
  },
  'AQW09': {
    'testType': 'Water-Level Fluctuation',
    'testExplanation': 'Roj Riley earth tides atmos'
  },
  'UBD01': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Core, know vol, dry 105, weigh'
  },
  'UBD02': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Excavate, dry, weigh, funnel'
  },
  'UBD03': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Excavate, dry, weigh, balloon'
  },
  'UBD04': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Excavate, dry, weigh, mensur'
  },
  'UBD05': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Clod, dry, weigh, immerse'
  },
  'UBD06': {
    'testType': 'Field Test',
    'testExplanation': 'Radiation, in situ'
  },
  'UDF01': {
    'testType': 'Field Test',
    'testExplanation': 'Water content dist at fix time'
  },
  'UDF02': {
    'testType': 'Field Test',
    'testExplanation': 'Water content vs time at X'
  },
  'UDF03': {
    'testType': 'Field Test',
    'testExplanation': 'Diffusivity-sorptivity'
  },
  'UHF01': {
    'testType': 'Field Test',
    'testExplanation': 'Auger hole'
  },
  'UHF02': {
    'testType': 'Field Test',
    'testExplanation': 'Piezometer method'
  },
  'UHF03': {
    'testType': 'Field Test',
    'testExplanation': 'Two-well technique'
  },
  'UHF04': {
    'testType': 'Field Test',
    'testExplanation': 'Multiple-well technique'
  },
  'UHF05': {
    'testType': 'Field Test',
    'testExplanation': 'Pit-bailing method'
  },
  'UHF06': {
    'testType': 'Field Test',
    'testExplanation': 'Double tube method'
  },
  'UHL01': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Constant head, sat'
  },
  'UHL02': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Falling head, sat'
  },
  'UHL03': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Head control, unsat'
  },
  'UHL04': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Flux control, unsat, long'
  },
  'UHL05': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Flux ctrl, unsat, short'
  },
  'UHL06': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Instantaneous profile'
  },
  'UHL07': {
    'testType': 'Laboratory Test',
    'testExplanation': 'High-res porous plate'
  },
  'UHL08': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Unit-gradient drain'
  },
  'UHL09': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Parameter identification'
  },
  'UNKN': {
    'testType': 'Unknown',
    'testExplanation': 'Unknown method'
  },
  'UPD01': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Pycnometer'
  },
  'UPD02': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Submersion'
  },
  'UPO01': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Calc from blk and prt density'
  },
  'UPO02': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Gas pycnometer - variable'
  },
  'UPO03': {
    'testType': 'Laboratory Test',
    'testExplanation': 'Gas pycnometer - constant'
  }
}

//instantiate map
$(document).ready(function () {
  console.log('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);
  $('#appVersion').html('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);

  Icon.Default.imagePath = './images/';

  //create map
  theMap = map('mapDiv', { zoomControl: false });

  //add zoom control with your options
  control.zoom({ position: 'topright' }).addTo(theMap);
  control.scale().addTo(theMap);

  //basemap
  layer = tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16
  }).addTo(theMap);

  //set initial view
  theMap.setView([MapY, MapX], MapZoom);

  //define layers
  sitesLayer = featureGroup().addTo(theMap);

  loadSites();
  checkScienceBase();
  initializeFilters();

  /*  START EVENT HANDLERS */
  $('.basemapBtn').click(function () {
    $('.basemapBtn').removeClass('slick-btn-selection');
    $(this).addClass('slick-btn-selection');
    var baseMap = this.id.replace('btn', '');
    setBasemap(baseMap);
  });

  $('#mobile-main-menu').click(function () {
    $('body').toggleClass('isOpenMenu');
  });

  $('#resetView').click(function () {
    resetView();
  });

  $('#aboutButton').click(function () {
    $('#aboutModal').modal('show');
  });

  $('#applyFilters').click(function () {
    applyFilters();
  });

  $('#resetFilters').click(function () {
    resetFilters();
  });

  sitesLayer.on('click', function (e) {
    openPopup(e);
  });
  /*  END EVENT HANDLERS */
});

function resetFilters() {

  //reset geoJSON
  sitesLayer.clearLayers();
  var geoJSONlayer = geoJSON(featureCollection, {
    pointToLayer: function (feature, latlng) {

      //considtional classString
      var classString = iconLookup[feature.properties.testType];

      addToLegend(classString);

      var icon = L.divIcon({ className: classString })
      return L.marker(latlng, { icon: icon });
    }
  });

  sitesLayer.addLayer(geoJSONlayer);

  //clear filter selections
  $('.appFilter').each(function (i, obj) {
    var divID = $(obj).attr('id');
    $('#' + divID).val(null).trigger('change');
  });
}

function applyFilters() {

  //first check there are filters selected
  if ($('.appFilter option:selected').map(function () { return $(this).text(); }).length === 0) {
    alert('No valid filter selections were found');
    resetFilters();
    return;
  }

  $('.appFilter').each(function (i, obj) {
    var divID = $(obj).attr('id');
    var selectName = $(obj).data("selectname");
    var selectCode = $(obj).data("code");

    var filters = $('#' + divID).select2('data');
    var filterArray = filters.map(item => item.text);

    //make copy of JSON
    var newGeoJSON = sitesLayer.toGeoJSON();
    console.log('applying filters to:', newGeoJSON.features.length, 'sites');

    if (filters.length > 0) {

      console.log('found filter', divID, selectName, selectCode, filters, filterArray);
      var found = false;
      var foundCount = 0;
      var geoJSONlayer = geoJSON(newGeoJSON, {
        filter: function (feature) {
          if (filterArray.indexOf(feature.properties[selectCode]) !== -1) {
            found = true;
            foundCount +=1;
            return true;
          }

        },
        pointToLayer: function (feature, latlng) {

          //considtional classString
          var classString = iconLookup[feature.properties.testType];

          addToLegend(classString);

          var icon = L.divIcon({ className: classString })
          return L.marker(latlng, { icon: icon });
        }
      });

      console.log('found',foundCount,'features for',selectCode,filterArray)

      if (!found) alert('No features found that meet these query criteria');
      sitesLayer.clearLayers();
      sitesLayer.addLayer(geoJSONlayer);
    }
  });
}

function initializeFilters() {
  $('.appFilter').each(function (i, obj) {

    var divID = $(obj).attr('id');
    var selectName = $(obj).data('selectname');

    $('#' + divID).select2({
      placeholder: selectName,
      width: 'auto'
    });
  });
}

function setupFilters() {
  //get each individual site
  sitesLayer.eachLayer(function (geoJSON) {

    //loop over site properties to populate filters
    var index = 0;
    geoJSON.eachLayer(function (layer) {

      var filterObj = [
        {
          'name': 'Aquifer',
          'property': layer.feature.properties.C100,
          'divID': '#aquiferFilter'
        },
        {
          'name': 'Test Type',
          'property': layer.feature.properties.testType,
          'divID': '#testTypeFilter'
        },
        {
          'name': 'Test Method',
          'property': layer.feature.properties.C743,
          'divID': '#testMethodFilter'
        }
      ];

      $.each(filterObj, function (idx, obj) {
        if (obj.property.length > 0) {

          var data = {
            'id': index,
            'text': obj.property
          };

          //only add new filter option if it doesn't exist
          if ($(obj.divID).has("option:contains('" + data.text + "')").length === 0) {
            var newOption = new Option(data.text, data.id, false, false);
            $(obj.divID).append(newOption).trigger('change');
          }
        }
      });

      index += 1;
    });
  });
}

function checkScienceBase() {

  //first ping main endpoint, check hasChildren=true
  $.getJSON(scienceBaseRootURL + '/catalog/item/' + scienceBaseItem + '?format=json', function (main) {
    if (main.hasChildren) {
      //console.log('scienceBase item has children');

      $.getJSON(scienceBaseRootURL + '/catalog/items?parentId=' + scienceBaseItem + '&format=json', function (children) {
        //console.log('here',children);

        //now we have all the children (USGS sites), loop over
        $.each(children.items, function (index, site) {
          //console.log('child item:',site);

          //get all data for each child
          $.getJSON(site.link.url, function (data) {
            //console.log('siteData:',data);

            var siteID = data.title.split('_')[0];
            var report = {
              "reportTitle": data.webLinks[0].title,
              "url": data.webLinks[0].uri
            };
            var hydraulicData;
            var analysis = [];

            //loop over attached files
            $.each(data.files, function (index, file) {
              //console.log('file',file);

              if (file.contentType === "text/csv") hydraulicData = {
                "fileName": file.name,
                "url": file.downloadUri
              }

              else analysis.push({
                "fileName": file.name,
                "url": file.downloadUri
              });
            });

            scienceBaseItems[siteID] = {
              "hydraulicData": hydraulicData,
              "analysis": analysis,
              "report": report
            };
          })
        });

        console.log('scienceBase obj:', scienceBaseItems);
      });
    }
    else console.log('No scienceBase item children found');
  });

}

function openPopup(e) {
  console.log('site clicked', e.layer.feature.properties);

  var popupContent = '';
  var siteID;

  //look up better header
  $.each(e.layer.feature.properties, function (shortKey, property) {

    //lookup field descriptor
    var description = null;
    $.each(codeLookup, function (key, value) {
      if (key === shortKey) {
        if (value) description = value;
      }
    });

    //make sure we have something
    if (property.length > 0) {

      //make siteID a hyperlink
      if (shortKey === 'C001') {
        siteID = property;
        popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;<a href="https://waterdata.usgs.gov/ny/nwis/inventory/?site_no=' + property + '" target="_blank">' + property + '</a></br>';
      }

      //build observation well list
      else if (shortKey === 'obvervationWells' && property.length > 0) {
        popupContent += '<b>Observation Well(s):</b>&nbsp;&nbsp' + property.map(siteID => '<a href="https://waterdata.usgs.gov/ny/nwis/inventory/?site_no=' + siteID + '" target="_blank">' + siteID + '</a>').join(', ') + '</br>';
      }

      //convert date
      else if (shortKey === 'C099') {
        var d = new Date(property.substring(0, 4) + '-' + property.substring(4, 6) + '-' + property.substring(6, 8));
        d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
        d = d.toLocaleString('en-us', { month: 'long', day: 'numeric', year: 'numeric' });
        popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + d + '</br>';
      }

      // //lookup aquifter test method
      // else if (shortKey === 'C743') {
      // 	//only add to popup if not unknown
      // 	if (property != 'UNKN') {
      // 		var testExplanation = testMethodLookup[property].testExplanation;
      // 		popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + testExplanation + '</br>';
      // 	}
      // }

      //loop over results array
      else if (shortKey === 'results') {

        //lookup aquifter test method
        if (property != 'UNKN') {
          var testExplanation = testMethodLookup[e.layer.feature.properties.C743].testExplanation;
        }

        //build ordered list of results
        var resultsList = {};
        $.each(resultsLookup, function (resultKey, resultText) {

          resultsList[resultText] = '';
          //crowbar in the Test Method here
          if (resultText === 'Specific Capacity (gal/min)/ft' && testExplanation) resultsList['Test method'] = testMethodLookup[e.layer.feature.properties.C743].testExplanation;
        });

        $.each(property, function (k, v) {
          //look up longName for result
          $.each(resultsLookup, function (resultKey, resultText) {
            if (resultKey === v['C744']) {
              resultsList[resultText] = v['C105']
            }
          });
        });

        //loop over ordered results list
        $.each(resultsList, function (key, value) {
          if (value.length > 1) {
            popupContent += '<b>' + key + ':</b>&nbsp;&nbsp;' + value + '</br>'
          }
        });

      }

      else if (shortKey === 'testType') {
        popupContent += '<b>Test Type:</b>&nbsp;&nbsp;' + property + '</br>';
      }

      else if (shortKey === 'C743') {
        //do nothing
      }

      //otherwise add as normal
      else popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + property + '</br>';
    }
  });

  //get scienceBase stuff
  var SBmatchFound = false;
  $.each(scienceBaseItems, function (scienceBaseID, obj) {
    if (siteID === scienceBaseID) {
      SBmatchFound = true;
      //console.log('test',obj);

      $.each(obj, function (key, value) {

        console.log('test', key, value);

        //console.log(key,value);
        if (key === 'report' && value) {
          popupContent += '<b>Report:</b>&nbsp;&nbsp;<a href="' + value.url + '" target="_blank">' + value.url + '</a></br>';
        }
        if (key === 'hydraulicData' && value) popupContent += '<b>Hydraulic Data:</b>&nbsp;&nbsp;<a href="' + value.url + '" target="_blank">' + value.fileName + '</a></br>';
        if (key === 'analysis' && value.length > 0) {
          var linkList = '';
          $.each(value, function (i, v) {
            //console.log(i,v)
            linkList += '<a href="' + v.url + '" target="_blank">' + v.fileName + '</a>&nbsp;&nbsp;'
          });
          popupContent += '<b>Analysis:</b>&nbsp;&nbsp;' + linkList + '</br>';
        }
      });
    }
  });

  console.log('scienceBase match found for site:', siteID, SBmatchFound);

  var popup = L.popup({ minWidth: 320 })
    .setLatLng(e.latlng)
    .setContent(popupContent)
    .openOn(theMap);
}

function drawSites(sites) {

  featureCollection = {
    "type": "FeatureCollection",
    "features": []
  };

  $.each(sites, function (index, site) {

    var foundFlag = false;

    //search featureCollection to check if this well already exists
    $.each(featureCollection.features, function (key, feature) {
      $.each(feature.properties, function (key, value) {
        if (value === site.C001) {
          //if we already have this site in featureCollection just add extra properties
          foundFlag = true;

          if (site.C500 && feature.properties.obvervationWells.indexOf(site.C500) === -1) {
            feature.properties.obvervationWells.push(site.C500);
          }

          if (site.C744 && site.C105) {
            feature.properties.results.push({
              'C744': site.C744,
              'C105': site.C105
            });
          }
        }
      });
    });

    //not found, add a new feature
    if (!foundFlag) {

      //create empty array for observationWells unless we have something
      var observationWells = [];
      if (site.C500) observationWells = [site.C500];

      //get test Type
      var testType;
      $.each(testMethodLookup, function (testMethod, obj) {
        if (testMethod === site.C743) testType = obj.testType;
      });

      //special case for UNKN/SPEC.CAP case
      if ((site.C743 === 'UNKN' || site.C743 === '') && searchResultsList('SPEC.CAP', [{ 'C744': site.C744, 'C105': site.C105 }])) {
        testType = "Specific-Capacity Test";
      }

      //create main feature
      var feature = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [site.C910, site.C909]
        },
        "properties": {
          'C001': site.C001,
          'C012': site.C012,
          'C100': site.C100,
          'C101': site.C101,
          'C102': site.C102,
          'C099': site.C099,
          'testType': testType,
          'obvervationWells': observationWells,
          "results": [{
            'C744': site.C744,
            'C105': site.C105
          }],
          'C743': site.C743,
        }
      };

      //add to featureCollection
      featureCollection.features.push(feature);
    }
  });

  console.log('GeoJSON initial feature count:', featureCollection.features.length)

  var geoJSONlayer = geoJSON(featureCollection, {
    pointToLayer: function (feature, latlng) {

      //considtional classString
      var classString = iconLookup[feature.properties.testType];

      addToLegend(classString);

      var icon = L.divIcon({ className: classString })
      return L.marker(latlng, { icon: icon });
    }
  })

  sitesLayer.addLayer(geoJSONlayer);

  setupFilters();
}

function searchResultsList(text, list) {
  var found = false;
  $.each(list, function (idx, value) {
    if (value.C744 === text) found = true;
  })
  return found;
}

function addToLegend(classString) {

  var legendID;
  var description;
  $.each(iconLookup, function (text, icon) {
    if (icon === classString) {
      legendID = camelize(text);
      description = text;
    }
  });

  //check if this symbol is already in legend, if not add it
  if (document.getElementById(legendID) === null) {
    $("#legend").append('<div id="' + legendID + '" class="card-text"><icon class="' + classString + '" /><span>' + description + '</span></div>');
  }
}

function loadSites() {
  console.log('in loadSites')

  $.ajax({
    url: hydraulicsFile,
    success: function (data) {
      $('#loading').hide();
      data = parseRDB(data);
      drawSites(data)
    },
    dataType: "text",
    complete: function () {
      // call a function on complete 
    }
  });
}

function parseRDB(data) {

  var comments = true;
  var definitions = true;
  data = data.split(/\r?\n/);
  var results = [];
  for (var i = 0; i < data.length; i++) {

    //make sure there is something on the line
    if (data[i].length > 0) {

      //skip comment rows
      if (data[i].charAt(0) === '#') {
        continue;
      }
      //next row is column headings
      else if (comments && data[i].charAt(0) != '#') {
        comments = false;
        var RDBheaders = data[i].split('\t');
        var headers = [];

        //look up better header
        RDBheaders.forEach(function (item, index) {
          headers.push(item);
        });
      }
      //next row are unneeded data definitions
      else if (!comments && definitions) {
        definitions = false
      }
      //finally we are at the data rows
      else if (!comments && !definitions) {
        var row = data[i].split('\t');

        var obj = {};
        headers.forEach(function (item, i) {
          obj[item] = row[i];
        });
        results.push(obj);
      }
    }
  };
  return results;
}

function setBasemap(baseMap) {

  switch (baseMap) {
    case 'Streets': baseMap = 'Streets'; break;
    case 'Satellite': baseMap = 'Imagery'; break;
    case 'Clarity': baseMap = 'ImageryClarity'; break;
    case 'Topo': baseMap = 'Topographic'; break;
    case 'Terrain': baseMap = 'Terrain'; break;
    case 'Gray': baseMap = 'Gray'; break;
    case 'DarkGray': baseMap = 'DarkGray'; break;
    case 'NatGeo': baseMap = 'NationalGeographic'; break;
  }

  if (layer) theMap.removeLayer(layer);
  layer = basemapLayer(baseMap);
  theMap.addLayer(layer);
  if (layerLabels) theMap.removeLayer(layerLabels);
  if (baseMap === 'Gray' || baseMap === 'DarkGray' || baseMap === 'Imagery' || baseMap === 'ImageryClarity' || baseMap === 'Terrain') {
    layerLabels = basemapLayer(baseMap + 'Labels');
    theMap.addLayer(layerLabels);
  }
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}