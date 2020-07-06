// ------------------------------------------------------------------------------
// ----- Aquifer Test Locator ----------------------------------------------------------
// ------------------------------------------------------------------------------

// copyright:   2018 Martyn Smith - USGS NY WSC

// authors:  Martyn J. Smith - USGS NY WSC

// purpose:  Web Mapping interface for Aquifer Test System

// updates:
// 03.15.2018 mjs - Created
// 04.19.2019 mjs - Overhaul with new sciencebase
// 01.22.2020 mjs - Fix build, get new sciencebase setup deployed

//CSS imports
import 'bootstrap/dist/css/bootstrap.css';
import 'marker-creator/app/stylesheets/css/markers.css';
import 'leaflet/dist/leaflet.css';
import 'jquery-typeahead/dist/jquery.typeahead.min.css';
import 'select2/dist/css/select2.css';
import './styles/main.css';

//JS imports
import 'bootstrap';
import 'jquery-typeahead';
import 'select2';
import 'tokml';

import { map, control, tileLayer, featureGroup, geoJSON, Icon } from 'leaflet';
import { basemapLayer } from 'esri-leaflet';
import { config, library, dom } from '@fortawesome/fontawesome-svg-core';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faInfo } from '@fortawesome/free-solid-svg-icons/faInfo';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { faMinus } from '@fortawesome/free-solid-svg-icons/faMinus';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons/faExclamationCircle';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons/faQuestionCircle';
import { faCog } from '@fortawesome/free-solid-svg-icons/faCog';

import { faTwitterSquare } from '@fortawesome/free-brands-svg-icons/faTwitterSquare';
import { faFacebookSquare } from '@fortawesome/free-brands-svg-icons/faFacebookSquare';
import { faGooglePlusSquare } from '@fortawesome/free-brands-svg-icons/faGooglePlusSquare';
import { faGithubSquare } from '@fortawesome/free-brands-svg-icons/faGithubSquare';
import { faFlickr } from '@fortawesome/free-brands-svg-icons/faFlickr';
import { faYoutubeSquare } from '@fortawesome/free-brands-svg-icons/faYoutubeSquare';
import { faInstagram } from '@fortawesome/free-brands-svg-icons/faInstagram';

library.add(faBars, faPlus, faMinus, faInfo, faExclamationCircle, faCog, faQuestionCircle, faTwitterSquare, faFacebookSquare,faGooglePlusSquare, faGithubSquare, faFlickr, faYoutubeSquare, faInstagram );
config.searchPseudoElements = true;
dom.watch();

//START user config variables
var MapX = '-75.5'; //set initial map longitude
var MapY = '42.5'; //set initial map latitude
var MapZoom = 7; //set initial map zoom
var hydraulicsFiles = ['./hydraulics.subf.subf'];  //input RDB file
var scienceBaseRootURL = 'https://www.sciencebase.gov'; 
var scienceBaseItem = '5c0e8232e4b0c53ecb2ad8df';
//END user config variables 

//global variables
var theMap;
var featureCollection = {
  'type': 'FeatureCollection',
  'features': []
};
var layer, sitesLayer, layerLabels;
var scienceBaseItems = {};
var reportObj = {};
var sitesLoaded = 0;

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
  'C101': 'Top of tested interval (ft)',
  'C102': 'Bottom of tested interval (ft)',
  'C714': 'Aquifer',
  'testType': 'Test Type',
  'PUMP.DURATION': 'Pump Duration',
  'PUMP.RT': 'Pump Rate',
  'SAT.HORZ.COND': 'Saturated Horizontal Conductivity',
  'SAT.VERT.COND': 'Saturated Vertical Conductivity',
  'STOR.COEF': 'Storage Coefficient',
  'TRANSMISS': 'Transmissivity',
  'SPEC.CAP': 'Specific Capacity'
};

var resultsLookup = {
  'PUMP.RT': 'Pumping Rate (gal/min)',
  'PUMP.DURATION': 'Duration of pumping (hr)',
  'SPEC.CAP': 'Specific Capacity (gal/min)/ft',
  'TRANSMISS': 'Transmissivity (ft&#178/d)',
  'SAT.HORZ.COND': 'Hydraulic conductivity (ft/d)',
  'STOR.COEF': 'Storage coefficient',
};

var iconLookup2 = {
  'Unknown': '#8CACAF',
  'Slug Test': '#3092F4',
  'Multi-Well Aquifer Test': '#A06FF9',
  'Single-Well Aquifer Test': '#FB833C',
  'Specific-Capacity Test': '#F15B74',
  'Recovery Test': '#FCDC76',
};

var iconLookup = {
  'Unknown': 'wmm-pin wmm-mutedblue wmm-icon-circle wmm-icon-white wmm-size-25',
  'Slug Test': 'wmm-pin wmm-blue wmm-icon-circle wmm-icon-white wmm-size-25',
  'Multi-Well Aquifer Test': 'wmm-pin wmm-purple wmm-icon-circle wmm-icon-white wmm-size-25',
  'Single-Well Aquifer Test': 'wmm-pin wmm-orange wmm-icon-circle wmm-icon-white wmm-size-25',
  'Specific-Capacity Test': 'wmm-pin wmm-mutedred wmm-icon-circle wmm-icon-white wmm-size-25',
  'Recovery Test': 'wmm-pin wmm-yellow wmm-icon-circle wmm-icon-white wmm-size-25',
};

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
  'AQR04': {
    'testType': 'Recovery Test',
    'testExplanation': 'Picking'
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
};

var aquiferLookup = {
  "100CNZC": {
    "aqfr_nm": "Cenozoic Erathem"
  },
  "100VLFL": {
    "aqfr_nm": "Cenozoic Valley Fill"
  },
  "110QRNR": {
    "aqfr_nm": "Quaternary System"
  },
  "111AFCF": {
    "aqfr_nm": "Artificial Fill"
  },
  "111ALVM": {
    "aqfr_nm": "Holocene Alluvium"
  },
  "111BBTM": {
    "aqfr_nm": "Bay-Bottom Deposits"
  },
  "111BECH": {
    "aqfr_nm": "Beach Deposits"
  },
  "111DUNE": {
    "aqfr_nm": "Dune (Aeolian) Deposits"
  },
  "111DUNED": {
    "aqfr_nm": "Dune Deposits"
  },
  "111FILL": {
    "aqfr_nm": "Fill"
  },
  "111HLCN": {
    "aqfr_nm": "Holocene Series"
  },
  "111LAKE": {
    "aqfr_nm": "Lake Deposits"
  },
  "111SLMR": {
    "aqfr_nm": "Salt-Marsh Deposits"
  },
  "111TRRC": {
    "aqfr_nm": "Terrace Deposits"
  },
  "11220CL": {
    "aqfr_nm": "20-foot Clay"
  },
  "112GLCD": {
    "aqfr_nm": "Glacial Delta Deposits"
  },
  "112GLCLU": {
    "aqfr_nm": "Glacial Aquifer, Upper"
  },
  "112GRDR": {
    "aqfr_nm": "Gardiners Clay"
  },
  "112HBHD": {
    "aqfr_nm": "Harbor Hill Drift"
  },
  "112HBHO": {
    "aqfr_nm": "Harbor Hill Outwash"
  },
  "112HBHT": {
    "aqfr_nm": "Harbor Hill Till"
  },
  "112HHGM": {
    "aqfr_nm": "Harbor Hill Ground Moraine"
  },
  "112HHTM": {
    "aqfr_nm": "Harbor Hill Terminal Moraine"
  },
  "112ICCC": {
    "aqfr_nm": "Ice-Contact Deposits, Pleistocene"
  },
  "112ICNC": {
    "aqfr_nm": "Ice-Contact Deposits"
  },
  "112JMCO": {
    "aqfr_nm": "Jameco Aquifer"
  },
  "112KMTC": {
    "aqfr_nm": "Kame Terrace Deposits"
  },
  "112LAKE": {
    "aqfr_nm": "Lake Deposits"
  },
  "112NTSR": {
    "aqfr_nm": "North Shore Aquifer"
  },
  "112NTSRC": {
    "aqfr_nm": "North Confining Unit"
  },
  "112OTSH": {
    "aqfr_nm": "Outwash"
  },
  "112PGFG": {
    "aqfr_nm": "Port Washington Confining Unit"
  },
  "112PGQF": {
    "aqfr_nm": "Port Washington Aquifer"
  },
  "112PLSC": {
    "aqfr_nm": "Pleistocene Series"
  },
  "112RKGM": {
    "aqfr_nm": "Ronkonkoma Ground Moraine"
  },
  "112RKKD": {
    "aqfr_nm": "Ronkonkoma Drift"
  },
  "112RKKO": {
    "aqfr_nm": "Ronkonkoma Outwash"
  },
  "112RKKT": {
    "aqfr_nm": "Ronkonkoma Till"
  },
  "112RKTM": {
    "aqfr_nm": "Ronkonkoma Terminal Moraine"
  },
  "112SAND": {
    "aqfr_nm": "Sand"
  },
  "112SDGV": {
    "aqfr_nm": "Sand and Gravel"
  },
  "112SMTN": {
    "aqfr_nm": "Smithtown Clay"
  },
  "112TILL": {
    "aqfr_nm": "Till"
  },
  "120VLCC": {
    "aqfr_nm": "Volcanic Rocks"
  },
  "121MNNT": {
    "aqfr_nm": "Mannetto Gravel"
  },
  "200MSZC": {
    "aqfr_nm": "Mesozoic Erathem"
  },
  "210CRCS": {
    "aqfr_nm": "Cretaceous System"
  },
  "211CRCSU": {
    "aqfr_nm": "Upper Cretaceous Series"
  },
  "211LLYD": {
    "aqfr_nm": "Lloyd Aquifer"
  },
  "211MAGT": {
    "aqfr_nm": "Magothy Aquifer"
  },
  "211MGTY": {
    "aqfr_nm": "Magothy Aquifer"
  },
  "211MMGD": {
    "aqfr_nm": "Monmouth Greensand"
  },
  "211MNMG": {
    "aqfr_nm": "Matawan Group-Magothy Formation"
  },
  "211MNMT": {
    "aqfr_nm": "Monmouth Group"
  },
  "211MONM": {
    "aqfr_nm": "Monmouth Group"
  },
  "211MTWN": {
    "aqfr_nm": "Matawan Formation"
  },
  "211RCNF": {
    "aqfr_nm": "Raritan Confining Unit"
  },
  "211RRTN": {
    "aqfr_nm": "Raritan Formation"
  },
  "230TRSC": {
    "aqfr_nm": "Triassic System"
  },
  "231BRCK": {
    "aqfr_nm": "Brunswick Formation"
  },
  "231NWRK": {
    "aqfr_nm": "Newark Group"
  },
  "231PLSD": {
    "aqfr_nm": "Palisade Diabase"
  },
  "231STCN": {
    "aqfr_nm": "Stockton Formation"
  },
  "231TRSCU": {
    "aqfr_nm": "Upper Triassic Series"
  },
  "300CLSC": {
    "aqfr_nm": "Clastic Rocks"
  },
  "300PLZC": {
    "aqfr_nm": "Paleozoic Erathem"
  },
  "320PSLV": {
    "aqfr_nm": "Pennsylvanian System"
  },
  "324PSVL": {
    "aqfr_nm": "Pottsville Formation"
  },
  "330MSSP": {
    "aqfr_nm": "Mississippian System"
  },
  "337POCN": {
    "aqfr_nm": "Pocono Group"
  },
  "337POCO": {
    "aqfr_nm": "Pocono Group"
  },
  "340DVNN": {
    "aqfr_nm": "Devonian System"
  },
  "341CAND": {
    "aqfr_nm": "Canadaway Group"
  },
  "341CNDY": {
    "aqfr_nm": "Canadaway Group"
  },
  "341CNNG": {
    "aqfr_nm": "Conewango Group"
  },
  "341CNNT": {
    "aqfr_nm": "Conneaut Group"
  },
  "341CONT": {
    "aqfr_nm": "Conneaut Group"
  },
  "341DVNNU": {
    "aqfr_nm": "Devonian, Upper"
  },
  "341GENS": {
    "aqfr_nm": "Genesee Formation"
  },
  "341JVWF": {
    "aqfr_nm": "Java-West Falls Formation"
  },
  "341SONY": {
    "aqfr_nm": "Sonyea Formation"
  },
  "344DVNNM": {
    "aqfr_nm": "Devonian, Middle"
  },
  "344ESPS": {
    "aqfr_nm": "Esopus Formation"
  },
  "344HMLN": {
    "aqfr_nm": "Hamilton Group"
  },
  "344ONDG": {
    "aqfr_nm": "Onondaga Limestone"
  },
  "344TLLY": {
    "aqfr_nm": "Tully Limestone"
  },
  "347DVNNL": {
    "aqfr_nm": "Devonian, Lower"
  },
  "347HDBG": {
    "aqfr_nm": "Helderberg Group"
  },
  "347ORSK": {
    "aqfr_nm": "Oriskany Formation"
  },
  "350GRPD": {
    "aqfr_nm": "Green Pond Conglomerate"
  },
  "350SLRN": {
    "aqfr_nm": "Silurian System"
  },
  "351ACBB": {
    "aqfr_nm": "Akron-Coblesville-Bertie Formations, Undifferentiated"
  },
  "351AKRN": {
    "aqfr_nm": "Akron Dolomite"
  },
  "351BNTR": {
    "aqfr_nm": "Binnewater Sandstone"
  },
  "351BRTI": {
    "aqfr_nm": "Bertie Limestone"
  },
  "351CBLK": {
    "aqfr_nm": "Cobleskill Limestone"
  },
  "351CMLS": {
    "aqfr_nm": "Camillus Shale"
  },
  "351ERMS": {
    "aqfr_nm": "Eromosa Dolomite of Lockport Group"
  },
  "351GILD": {
    "aqfr_nm": "Goat Island Dolomite of Lockport Group"
  },
  "351GLPH": {
    "aqfr_nm": "Guelph Dolomite of Lockport Group"
  },
  "351LCKP": {
    "aqfr_nm": "Lockport Dolomite"
  },
  "351LNGD": {
    "aqfr_nm": "Longwood Shale"
  },
  "351SALN": {
    "aqfr_nm": "Salina Group"
  },
  "351SLIN": {
    "aqfr_nm": "Salina Group"
  },
  "351SLRNU": {
    "aqfr_nm": "Silurian, Upper"
  },
  "351SRCS": {
    "aqfr_nm": "Syracuse Salt"
  },
  "351VRNN": {
    "aqfr_nm": "Vernon Shale"
  },
  "354CLIN": {
    "aqfr_nm": "Clinton Group"
  },
  "354CLNN": {
    "aqfr_nm": "Clinton Group"
  },
  "354SLRNM": {
    "aqfr_nm": "Silurian, Middle"
  },
  "354SNGK": {
    "aqfr_nm": "Shawangunk Formation"
  },
  "355LCKP": {
    "aqfr_nm": "Lockport Dolomite"
  },
  "357ALBN": {
    "aqfr_nm": "Albion Group"
  },
  "357CLIN": {
    "aqfr_nm": "Clinton Group"
  },
  "357DECW": {
    "aqfr_nm": "Decew Dolomite of Clinton Group"
  },
  "357GAPR": {
    "aqfr_nm": "Gasport Dolomite of Lockport Group"
  },
  "357GRMB": {
    "aqfr_nm": "Grimsby Formation of Medina Group"
  },
  "357IRDQ": {
    "aqfr_nm": "Irondequoit Limestone of Clinton Group"
  },
  "357MDIN": {
    "aqfr_nm": "Medina Group"
  },
  "357NEHG": {
    "aqfr_nm": "Neahga Shale of Clinton Group"
  },
  "357RNLS": {
    "aqfr_nm": "Reynales Limestone of Clinton Group"
  },
  "357ROCR": {
    "aqfr_nm": "Rochester Shale of Clinton Group"
  },
  "357SLRNL": {
    "aqfr_nm": "Silurian, Lower"
  },
  "357TRLD": {
    "aqfr_nm": "Thorold Sandstone of Medina Group"
  },
  "357WRLP": {
    "aqfr_nm": "Whirlpool Sandstone of Medina Group"
  },
  "360ODVC": {
    "aqfr_nm": "Ordovician System"
  },
  "361LRRN": {
    "aqfr_nm": "Lorraine Shale"
  },
  "361ODVCU": {
    "aqfr_nm": "Ordovician, Upper"
  },
  "361OSWG": {
    "aqfr_nm": "Oswego Sandstone"
  },
  "361QNSN": {
    "aqfr_nm": "Queenston Shale"
  },
  "361UTIC": {
    "aqfr_nm": "Utica Shale"
  },
  "364BRKR": {
    "aqfr_nm": "Berkshire Schist"
  },
  "364CHZY": {
    "aqfr_nm": "Chazy Group"
  },
  "364CNJR": {
    "aqfr_nm": "Canajoharie Shale"
  },
  "364NMKL": {
    "aqfr_nm": "Normanskill Formation"
  },
  "364ODVCM": {
    "aqfr_nm": "Ordovician, Middle"
  },
  "364SKHL": {
    "aqfr_nm": "Snake Hill Formation"
  },
  "364TBRV": {
    "aqfr_nm": "Trenton-Black River Group"
  },
  "364TREN": {
    "aqfr_nm": "Trenton Group"
  },
  "364TRNN": {
    "aqfr_nm": "Trenton Group"
  },
  "364WLMC": {
    "aqfr_nm": "Walloomsac Slate"
  },
  "367BKMN": {
    "aqfr_nm": "Beekmantown Group"
  },
  "367ODVCL": {
    "aqfr_nm": "Ordovician, Lower"
  },
  "367PLTN": {
    "aqfr_nm": "Poultney Slate"
  },
  "367TBHL": {
    "aqfr_nm": "Tribes Hill Limestone"
  },
  "370CMBR": {
    "aqfr_nm": "Cambrian System"
  },
  "371CMBRM": {
    "aqfr_nm": "Middle Cambrian Series"
  },
  "371CMBRU": {
    "aqfr_nm": "Cambrian, Upper"
  },
  "371LLFL": {
    "aqfr_nm": "Little Falls Dolomite"
  },
  "371PSDM": {
    "aqfr_nm": "Potsdam Sandstone"
  },
  "371TCSQ": {
    "aqfr_nm": "Taconic Sequence"
  },
  "371THRS": {
    "aqfr_nm": "Theresa Dolomite"
  },
  "374CMBRM": {
    "aqfr_nm": "Cambrian, Middle"
  },
  "374SKBG": {
    "aqfr_nm": "Stockbridge Group"
  },
  "377BULL": {
    "aqfr_nm": "Bull Slate"
  },
  "377CMBRL": {
    "aqfr_nm": "Lower Cambrian Series"
  },
  "377DLTN": {
    "aqfr_nm": "Dalton Formation"
  },
  "377EZVB": {
    "aqfr_nm": "Elizaville and Berkshire Formations"
  },
  "377NSSU": {
    "aqfr_nm": "Nassau Formation"
  },
  "377PGQY": {
    "aqfr_nm": "Poughquay Quartzite"
  },
  "377SCCK": {
    "aqfr_nm": "Schodack Formation"
  },
  "377SSNG": {
    "aqfr_nm": "Stissing Dolomite"
  },
  "400BCPX": {
    "aqfr_nm": "Basement Complex"
  },
  "400PCMB": {
    "aqfr_nm": "Precambrian Erathem"
  },
  "BASEMENT": {
    "aqfr_nm": "Basement"
  },
  "BEDROCK": {
    "aqfr_nm": "Bedrock"
  }
};

//instantiate map
$(document).ready(function () {
  console.log('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);
  $('#appVersion').html('Application Information: ' + process.env.NODE_ENV + ' ' + 'version ' + VERSION);

  Icon.Default.imagePath = './images/';

  //create map
  theMap = map('mapDiv', { preferCanvas: true, zoomControl: false });

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

	$('#exportGeoJSON').click(function() {
		downloadData('geojson');
	});	

	$('#exportCSV').click(function() {
		downloadData('csv');
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

      var color = iconLookup2[feature.properties.testType];
      if (color) {

        addToLegend(color);

        return L.circleMarker(latlng, {

          radius: 8,
          fillColor: color,
          color: "#000",
          weight: .25,
          opacity: 1,
          fillOpacity: 0.8
        });
      }

      else {
        console.warn('Marker icon not found for:',feature.properties)
        return false;
      }
		}
  });

  sitesLayer.addLayer(geoJSONlayer);
  theMap.fitBounds(sitesLayer.getBounds(), {padding: [100,100]});

  //clear filter selections
  $('.appFilter').not('#siteIDFilter').each(function (i, obj) {
    var divID = $(obj).attr('id');
    $('#' + divID).val(null).trigger('change');
  });

  //clear siteIDs
  $('#siteIDFilterWrapper .typeahead__cancel-button').each(function( index ) {
    $(this).trigger('click');
  });
}

function applyFilters() {

  var filterFound = false;

  $('.appFilter').each(function (i, obj) {
    var divID = $(obj).attr('id');
    var selectCode = $(obj).data("code");

    console.log('in applyfilters:', divID)

    var filterArray = [];

    if (divID == 'siteIDFilter') {
      $('.typeahead__label span').not('.typeahead__cancel-button').each(function( index ) {
        filterArray.push($( this ).text());
        console.log('found',$( this ).text(), filterArray)
      });
    }

    else {
      filterArray = $('#' + divID + ' option:selected').toArray().map(item => item.text);
    }

    if (filterArray.length > 0) {
      filterFound = true;
        
      //make copy of JSON
      var newGeoJSON = sitesLayer.toGeoJSON();
      console.log('applying filters to:', newGeoJSON.features.length, 'sites');

      console.log('found filter', divID, selectCode, filters, filterArray);
      var found = false;
      var foundCount = 0;
      var geoJSONlayer = geoJSON(newGeoJSON, {
        filter: function (feature) {

          var selectionCode = feature.properties[selectCode];

          //console.log('selection Code2:', selectionCode)

          //special exception for report
          if (feature.properties[selectCode] && selectCode == 'report') selectionCode = feature.properties[selectCode].reportName

          if (filterArray.indexOf(selectionCode) !== -1) {
            found = true;
            foundCount +=1;
            return true;
          }

        },
        pointToLayer: function (feature, latlng) {

          var color = iconLookup2[feature.properties.testType];
          if (color) {
    
            addToLegend(color);
    
            return L.circleMarker(latlng, {
    
              radius: 8,
              fillColor: color,
              color: "#000",
              weight: .25,
              opacity: 1,
              fillOpacity: 0.8
            });
          }
    
          else {
            console.warn('Marker icon not found for:',feature.properties)
            return false;
          }
        }
      });

      console.log('found',foundCount,'features for',selectCode,filterArray)

      if (!found) alert('No features found that meet these query criteria');
      
      sitesLayer.clearLayers();
      sitesLayer.addLayer(geoJSONlayer);
      theMap.fitBounds(sitesLayer.getBounds(), {padding: [100,100]});
      
    }
  });

  //if nothing was found after the loop, show alert
  if (!filterFound) alert('No valid filter selections were found');
}

function setupFilters() {

  //loop over select2 filter divs 
  $( ".appFilter" ).each(function( i, obj ) {

    var code = $(obj).data('code');
    var id = $(obj).attr('id');
    var selectName = $(obj).attr('title');

    //bail if this is siteID filter
    if (id == 'siteIDFilter') return;

    //initialize select2 filter
    $('#' + id).select2({
      placeholder: selectName,
      width: '100%'
    });

    //get each individual site
    $.each(featureCollection.features, function (index, feature) {

      //make sure we have a code and there is some text
      if (code && code.length > 0 && feature.properties[code]) {

        var text;

        //special case for report filter
        if (code == 'report') {

          //CODE FOR PARSING OUT A SHORTER REPORT NAME FOR THE REPORT FILTER

          var urlList = feature.properties[code].uri.split('/');
          var reportShortName = urlList[urlList.length - 1];
          var reportFullName = 'USGS ';

          //special case for 'professional paper'
          if (reportShortName === 'report.pdf') {
            //console.log('do something with this:', feature.properties[code])
            var type = urlList[urlList.length - 3].toUpperCase();
            var number = urlList[urlList.length - 2].toUpperCase();
            reportFullName += type + ' ' + number;
          }

          //otherwise assume its one of these report types
          else {
            if (reportShortName.indexOf('ofr') !== -1 || reportShortName.indexOf('sir') !== -1 || reportShortName.indexOf('wri') !== -1 ) {
              var type = reportShortName.substring(0, 3).toUpperCase();
              var number = reportShortName.substring(3);
              reportFullName += type + ' ' + number;
              //console.log('found parsable report name:', reportShortName, reportFullName);
  
            }
          }

          feature.properties[code].reportName = reportFullName;

          //add to report object
          if (!reportObj[reportFullName]) {
            reportObj[reportFullName] = feature.properties[code];

            //add to modal table
            $('#reportTableBody').append('<tr><td>' + feature.properties[code].reportName + '</td><td>' + feature.properties[code].title + '</td><td><a href="' + feature.properties[code].uri + '" target="_blank">link</a></td></tr>')
      
          }

          //console.log('report obj:', reportObj)
          //console.log('populating report filter dropdown:', feature.properties[code])
          
          //text = feature.properties[code].title.trim();
          text = reportFullName;
        }

        else {
          text = feature.properties[code].trim();
        }


        //console.log('adding option:', text)

        //only add new filter option if it doesn't exist
        if ($('#' + id).has("option:contains('" + text + "')").length === 0) {
          $('#' + id).append('<option value="'+index+'">'+text+'</option>');
        }
      }
      else {
        //console.log('Site missing some properties to add to filters:',feature.properties)
      }
    });

    $('#' + id).trigger('change');

  });

  //setup siteID typeahead
  var siteIDarray = [];
  $.each(featureCollection.features, function (index, feature) {
    siteIDarray.push(feature.properties['C001'])
  })

  $.typeahead({
    input: '.js-typeahead',
    order: "desc",
    source: {
        data: siteIDarray
    },
    cancelButton: false,
    multiselect: {
      limit: 5
    },
    callback: {
      onInit: function (node) {
          //console.log('Typeahead Initiated on ', $(node).attr('id'));
      }
    }
  });

}

function checkScienceBase() {

  //loop over entire sciencebase structure and get all data
  var done = false;

  //first ping main endpoint, check hasChildren=true
  $.getJSON(scienceBaseRootURL + '/catalog/item/' + scienceBaseItem + '?format=json', function (main) {
    if (main.hasChildren) {
      //console.log('scienceBase item has children');

      $.getJSON(scienceBaseRootURL + '/catalog/items?parentId=' + scienceBaseItem + '&format=json', function (children) {
        //console.log('All children:',children);

        //now we have all the children (USGS sites), loop over
        $.each(children.items, function (index, site) {
          //console.log('Main child item:',site.title);

          var section = 'PUBLICATIONS';
          if (site.title.indexOf('DATA RELEASES') !== -1) section = 'DATA RELEASES';

          //loop over publications
          if (site.hasChildren) {

            $.getJSON(scienceBaseRootURL + '/catalog/items?parentId=' + site.id + '&format=json', function (sectionChildren) {
              //console.log(section + ' children found:',sectionChildren.items.length);

              $.each(sectionChildren.items, function (index, sectionChildSite) {
                //console.log(section + ' child site:',sectionChildSite.title, sectionChildSite);

                if (sectionChildSite.hasChildren) {

                  $.getJSON(scienceBaseRootURL + '/catalog/items?parentId=' + sectionChildSite.id + '&format=json', function (sectionChildSiteChildren) {
                    //console.log(section + ' children of children found:',sectionChildSiteChildren, "HERE");

                    $.each(sectionChildSiteChildren.items, function (index, sectionChildSiteChildrenSite) {
                      //console.log(section + ' child of children site:',sectionChildSiteChildrenSite.title);

                      if (sectionChildSiteChildrenSite.hasChildren) {

                        $.getJSON(scienceBaseRootURL + '/catalog/items?parentId=' + sectionChildSite.id + '&format=json', function (sectionChildSiteChildren) {
                          //console.log(section + ' children of children found:',sectionChildSiteChildren.items.length);
      
                          $.each(sectionChildSiteChildren.items, function (index, sectionChildSiteChildrenSite) {
                            //console.log(section + ' child of children site:',sectionChildSiteChildrenSite.title);

                            if (sectionChildSiteChildrenSite.hasChildren) {

                              $.getJSON(scienceBaseRootURL + '/catalog/items?parentId=' + sectionChildSiteChildrenSite.id + '&format=json', function (dataItem) {
                                //console.log(section + ' children of children of children found:',dataItem);
            
                                $.each(dataItem.items, function (index, item) {
                                  //console.log('in item loop', item)

                                  if (!item.hasChildren) {
                                    //console.log('WE HAVE REACHED THE END OF THE TREE:', sectionChildSiteChildrenSite.title)

                                    //get full item
                                    $.getJSON(item.link.url + '?format=json', function (fileData) {

                                      //console.log('full item:',fileData);

                                      //get citation
                                      var citation = {};
                                      $.each(fileData.webLinks, function (index, webLink) {
                                        if (webLink.type == 'publicationReferenceSource') {
                                          citation = webLink;
                                        }
                                      });

                                      //case where we have many files here at end of tree
                                      if (fileData.files && fileData.files.length > 0) {
                                        $.each(fileData.files, function (index, file) {

                                          var siteID = String(file.name.split('_')[0]);
                                          var date = String(file.name.split('_')[1]);

                                          //make sure we have a real site
                                          if (siteID === 'CURVfiles' || siteID === 'DISPfiles') {
                                            return;
                                          }
                   
                                          //initiate this site if we dont have it
                                          if (!(siteID in scienceBaseItems)) {
                                            scienceBaseItems[siteID] = {
                                              analysis: [],
                                              hydraulicData: [],
                                              report: citation
                                            };
                                          }
          
                                          var newObj = {
                                            fileName: file.name,
                                            url: file.url,
                                            date: date
                                          };
  
                                          if (file.contentType == 'application/pdf') {
                                            scienceBaseItems[siteID].analysis.push(newObj);
                                          }
  
                                          if (file.contentType == 'text/csv') {
                                            scienceBaseItems[siteID].hydraulicData.push(newObj);
                                          }  
                                        });
                                      }

                                      //otherwise if no files, just get report citation
                                      else {
                                        
                                        var siteID = String(fileData.title.split('_')[0]);
                                        var localID = String(fileData.title.split('_')[1]);

                                        //initiate this site if we dont have it
                                        if (!(siteID in scienceBaseItems)) {
                                          scienceBaseItems[siteID] = {
                                            report: citation
                                          };
                                        }
                                      }
                                    });
                                  }
                                });
                              });
                            }
                          });
                        });
                      }

                      //if no children here we need to scrape the summary text for site list
                      else {
                        
                        if (sectionChildSiteChildrenSite.summary && sectionChildSiteChildrenSite.summary.indexOf('LIST OF HYDRAULIC TESTS:') !== -1) {
                          //console.log('END OF TREE NEED TO REQUEST ACTUAL ITEM:', sectionChildSiteChildrenSite, sectionChildSiteChildrenSite.link.url)

                          $.getJSON(scienceBaseRootURL + '/catalog/item/' + sectionChildSiteChildrenSite.id + '?format=json', function (wellListItem) {
                            //console.log('8888 IN HERE', wellListItem)

                            var fullWellList = wellListItem.body.split('LIST OF HYDRAULIC TESTS:<br>\n')[1].split('<br>\n&nbsp;')[0]
                            var wellList = fullWellList.split(',');
                            var citation = wellListItem.citation;
                            //console.log('LIST OF HYDRAULIC TESTS WELL LIST:', wellList, citation)

                            $.each(wellList, function (index, well) {

                              var siteID = well.split('_')[0].trim();

                              //add to sciencebase internal object
                              scienceBaseItems[siteID] = {
                                report: wellListItem.webLinks[0]
                              };
                            });
                          });
                        }
                      }
                    });
                  });
                }
              });
            });
          }
        });

        console.log('scienceBase obj:', scienceBaseItems);
      });
    }
    else console.log('No scienceBase item children found');
  });

}

function openPopup(e) {

  console.log('site clicked', e.layer.feature.properties);

  var popup = L.popup({ minWidth: 320 })
    .setLatLng(e.latlng);

  var popupContent = '';
  var siteID;

  //look up better header
  $.each(e.layer.feature.properties, function (shortKey, property) {

    //lookup field descriptor
    var description = codeLookup[shortKey];

    //make sure we have something
    if (property) {

      //make siteID a hyperlink
      if (shortKey === 'C001') {
        siteID = property;
        popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;<a href="https://waterdata.usgs.gov/nwis/inventory/?site_no=' + property + '" target="_blank">' + property + '</a></br>';

        if (e.layer.feature.properties['C099']) {
          var dateString = e.layer.feature.properties['C099'];

          //if we only have year
          if (dateString.length == 4) {
            var d = new Date(dateString);
            var startDateText = d.getFullYear().toString();
            var endDateText = d.getFullYear().toString();
          }

          else {
            var d = new Date(dateString.substring(0, 4) + '-' + dateString.substring(4, 6) + '-' + dateString.substring(6, 8));
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            var startDate = new Date(d.setDate(d.getDate() - 3));
            var endDate = new Date(d.setDate(d.getDate() + 10));
            var startDateText = startDate.getFullYear() + '-' + (startDate.getMonth() + 1) + '-' + startDate.getDate();
            var endDateText = endDate.getFullYear() + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate();
          }

          console.log('startDate',startDateText,'endDate',endDateText)


          //get gwlevel data
          var DDcodes = ['62610','62611','72019'];
          $.each(DDcodes, function (idx, code) {
            var url = 'https://nwis.waterservices.usgs.gov/nwis/iv/?format=rdb&sites=' + siteID + '&startDT=' + startDateText + '&endDT=' +  endDateText + '&parameterCd=' + code + '&siteStatus=all';

            addNWISdata(url,siteID,popup,'Water Level Data');
          });

          //get pumping data
          var code = '00058';
          var url = 'https://nwis.waterservices.usgs.gov/nwis/iv/?format=rdb&sites=' + siteID + '&startDT=' + startDateText + '&endDT=' +  endDateText + '&parameterCd=' + code + '&siteStatus=all';

          addNWISdata(url,siteID,popup,'Pumping Rate Data');    

        }
      }

      //get aquifer code
      else if (shortKey === 'C714') {
        var aqText = aquiferLookup[property].aqfr_nm
        popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + aqText + ' (' + property + ')</br>';
      }

      //build observation well list
      else if (shortKey === 'obvervationWells') {

        if (property.length == 0) return;

        popupContent += '<b>Observation Well(s):</b>&nbsp;&nbsp' + property.map(siteID => '<a href="https://waterdata.usgs.gov/nwis/inventory/?site_no=' + siteID + '" target="_blank">' + siteID + '</a>').join(', ') + '</br>';

        if (e.layer.feature.properties['C099']) {
          var dateString = e.layer.feature.properties['C099'];
          var d = new Date(dateString.substring(0, 4) + '-' + dateString.substring(4, 6) + '-' + dateString.substring(6, 8));
          d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
          var startDate = new Date(d.setDate(d.getDate() - 3));
          var endDate = new Date(d.setDate(d.getDate() + 10));
          var startDateText = startDate.getFullYear() + '-' + (startDate.getMonth() + 1) + '-' + startDate.getDate();
          var endDateText = endDate.getFullYear() + '-' + (endDate.getMonth() + 1) + '-' + endDate.getDate();
          console.log('startDate',startDateText,'endDate',endDateText)

          $.each(property, function (idx, siteID) {
            //get gwlevel data
            var DDcodes = ['62610','62611','72019'];
            $.each(DDcodes, function (idx, code) {
              var url = 'https://nwis.waterservices.usgs.gov/nwis/iv/?format=rdb&sites=' + siteID + '&startDT=' + startDateText + '&endDT=' +  endDateText + '&parameterCd=' + code + '&siteStatus=all';
  
              addNWISdata(url,siteID,popup,'Water Level Data');
            });
  
            //get pumping data
            var code = '00058';
            var url = 'https://nwis.waterservices.usgs.gov/nwis/iv/?format=rdb&sites=' + siteID + '&startDT=' + startDateText + '&endDT=' +  endDateText + '&parameterCd=' + code + '&siteStatus=all';
  
            addNWISdata(url,siteID,popup,'Pumping Rate Data');   
          }); 
        }
      }

      //convert date
      else if (shortKey === 'C099') {

        //special method for year only dates
        if (property.length == 4) {
          popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + property + '</br>';
        }

        else {
          var d = new Date(property.substring(0, 4) + '-' + property.substring(4, 6) + '-' + property.substring(6, 8));
          d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
          d = d.toLocaleString('en-us', { month: 'long', day: 'numeric', year: 'numeric' });
          popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + d + '</br>';
        }

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
            //console.log('CLICK', resultKey, resultText, k, v)
            if (resultKey === v['C744']) {
              resultsList[resultText] = v['C105']
            }
          });
        });

        //loop over ordered results list
        $.each(resultsList, function (key, value) {
          if (value.length > 0) {
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

      //get scienceBase stuff
      else if (shortKey === 'report') {
        popupContent += '<div id="reportDiv"><b>Link to report:</b>&nbsp;&nbsp;<a href="' + property.uri + '" target="_blank">Report</a></div>';
      }
      else if (shortKey === 'hydraulicData') {
        var linkList = '';
        $.each(property, function (i, v) {
          //console.log(i,v)
          linkList += '<b>Water Level Data:</b>&nbsp;&nbsp;<a href="' + v.url + '" target="_blank">' + siteID + '</a>';
        });
        popupContent += linkList + '</br>';
      }
      else if (shortKey === 'analysis') {
        var linkList = '';
        $.each(property, function (i, v) {
          //console.log(i,v)
          linkList += '<b>Analysis:</b>&nbsp;&nbsp;<a href="' + v.url + '" target="_blank">' + siteID + '</a>';
        });
        popupContent += linkList + '</br>';
      }

      //otherwise add as normal
      else {
        popupContent += '<b>' + description + ':</b>&nbsp;&nbsp;' + property + '</br>';
      }
    }
  });

  popup.setContent(popupContent).openOn(theMap);
}

function addNWISdata(url,siteID,popup,text) {

  console.log("URL",url)
  $.ajax({
    url: url,
    success: function (data) {
      data = data.split(/\r?\n/);

      if (data[0] === '#  No sites found matching all criteria') {
        console.log(text,siteID,'NO DATA');
        return false;
      }

      var $popupContent = $('<div/>').html(popup.getContent());
      
      console.log(text,siteID,"FOUND SOME DATA");
      
      //if the div doesnt exist yet, create and add this item
      if ($popupContent.find('#' + camelize(text)).length === 0) {

        //make sure these get inserted before the report div if it exists
        if ($popupContent.find('#reportDiv').length > 0) {
          $popupContent.find('#reportDiv').before('<div id="' + camelize(text) + '"><b>' + text + ':</b>&nbsp;&nbsp<a href="' + url + '" target="_blank">' + siteID + '</a></div>');
          popup.setContent($popupContent.html()) 
        }
        //otherwise just append to the end
        else {
          $popupContent.append('<div id="' + camelize(text) + '"><b>' + text + ':</b>&nbsp;&nbsp<a href="' + url + '" target="_blank">' + siteID + '</a></div>');
          popup.setContent($popupContent.html()) 
        }
      }

      //otherwise just append the item
      else {
        $popupContent.find('#' + camelize(text)).append(', <a href="' + url + '" target="_blank">' + siteID + '</a>');
        popup.setContent($popupContent.html())
      }
    },
    dataType: "text"
  });
}

function drawSites(sites) {

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

      //console.log('found new site:',site)

      //create empty array for observationWells unless we have something
      var observationWells = [];
      if (site.C500) observationWells = [site.C500];

      //get test Type
      var testType;
      $.each(testMethodLookup, function (testMethod, obj) {
        if (testMethod === site.C743) testType = obj.testType;
      });

      //special case for UNKN/SPEC.CAP case
      if (site.C743 === 'UNKN' || site.C743 === '') {

        if (searchResultsList('SPEC.CAP', [{ 'C744': site.C744, 'C105': site.C105 }])) {
          testType = "Specific-Capacity Test";
        }
        else {
          console.warn("Cant find testType for:",site.C743,site)
          testType = "Unknown";
        }
        
      }

      //create main feature
      var feature = {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [parseFloat(site.C910), parseFloat(site.C909)]
        },
        "properties": {
          'C001': site.C001,
          'C012': site.C012,
          'C714': site.C714,
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

  console.log('GeoJSON initial feature count:', featureCollection);

  var geoJSONlayer = geoJSON(featureCollection, {
    pointToLayer: function (feature, latlng) {

      var color = iconLookup2[feature.properties.testType];
      if (color) {

        addToLegend(color);

        return L.circleMarker(latlng, {

          radius: 8,
          fillColor: color,
          color: "#000",
          weight: .25,
          opacity: 1,
          fillOpacity: 0.8
        });
      }

      else {
        console.warn('Marker icon not found for:',feature.properties)
        return false;
      }
		}
  })

  sitesLayer.addLayer(geoJSONlayer);

  //load science base info
  sitesLoaded += 1;
  if (sitesLoaded === hydraulicsFiles.length) {
    checkScienceBase();

    $(document).ajaxStop(function() {
      //console.log("ALL AJAX COMPLETED")
      appendScienceBaseData();
      // place code to be executed on completion of last outstanding ajax call here
    });
  }


}

function appendScienceBaseData() {

  var counter = 0;
  
  //loop over every feature
  $.each(featureCollection.features, function (key, feature) {

    counter++;

    //check if we have sciencebase data for this site
    if (scienceBaseItems.hasOwnProperty(feature.properties.C001)) {
      feature.properties.report = scienceBaseItems[feature.properties.C001].report;
      feature.properties.analysis = scienceBaseItems[feature.properties.C001].analysis;
      feature.properties.hydraulicData = scienceBaseItems[feature.properties.C001].hydraulicData;
    }

    //when we are done adding data we can do the next thing
    if(counter == featureCollection.features.length) {
      //now we can setup filters properly
      setupFilters();
    }

  });

  
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
  $.each(iconLookup2, function (text, icon) {
    if (icon === classString) {
      legendID = camelize(text);
      description = text;
    }
  });

  //check if this symbol is already in legend, if not add it
  if (document.getElementById(legendID) === null) {
    $("#legend").append('<div id="' + legendID + '" class="card-text"><span><i class="circle" style="background:' + classString + '"></i>' + description + '</span></div>');
  }
}

function loadSites() {

  $(hydraulicsFiles).each(function (i, hydraulicsFile) {
    console.log('in loadSites. loading:',hydraulicsFile)

    $.ajax({
      url: hydraulicsFile,
      dataType: "text",
      success: function (data) {
        $('#loading').hide();
        data = parseRDB(data);
        //console.log('parsed RDB',data)
        drawSites(data)
      }
    });
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
  if (baseMap === 'Gray' || baseMap === 'DarkGray' || baseMap === 'Imagery' || baseMap === 'Terrain') {
    layerLabels = basemapLayer(baseMap + 'Labels');
    theMap.addLayer(layerLabels);
  }
}

function downloadData(type) {

  var geoJSON = sitesLayer.toGeoJSON();

  //check if we only want to export selected view
  if ($('#exportCurrentView').is(":checked")) {
    console.log('CURRENT VIEW ONLY',geoJSON)

    //create temp fc for current view
    var fc = {
      type: "FeatureCollection",
      features: []
    }

    //find features in current map extent
    geoJSON.features.forEach(function(feature) {
      if ( theMap.getBounds().contains([feature.geometry.coordinates[1],feature.geometry.coordinates[0]])) {
        fc.features.push(feature);
      }
    });

    //overwrite export layer
    geoJSON = fc;
    console.log(geoJSON)
  }
  
  //theMap.getBounds().contains()

  //first flatten geojson attributes
  // for (var i = 0; i < geoJSON.features.length; i++) {
  //   var props = geoJSON.features[i].properties;
  //   var flattened = flatten(props);
  //   geoJSON.features[i].properties = flattened;
  // }

  // console.log(geoJSON)

  if (!geoJSON || geoJSON.features.length == 0) {
    alert('No sites to export');
    return
  }

  if (type === 'geojson') {

    var data = JSON.stringify(geoJSON)
    var filename = 'data.geojson';
    
    //console.log(data);
		downloadFile(data,filename)
  }

  if (type === 'csv') {
    var attributeCodes = ['C001','C012','C714','C101','C102','C099','testType','C743']
    var resultCodes = ['PUMP.DURATION','PUMP.RT','SAT.HORZ.COND','SAT.VERT.COND','STOR.COEF','TRANSMISS','SPEC.CAP']

    //lookup verbose headers and combine arrays
    var headerRowList = attributeCodes.map(x => codeLookup[x]).concat(resultCodes.map(x => codeLookup[x]))

    console.log('HEADER ROW:',headerRowList.length, headerRowList)

    var csvData = [];
    var dupList = [];

    //push CSV header row
    csvData.push(headerRowList.join(','));

    geoJSON.features.forEach(function(feature) {
        var attributes = [];
        var rowObj = {};
        
        //first write out main attributeCodes
        attributeCodes.forEach(function(name) {
            attributes.push(feature.properties[name].toString());
            var label = codeLookup[name];
            rowObj[label] = '';
            rowObj[label] = feature.properties[name].toString();

            //if this is a siteID, encase it in quotes
            if (name == 'C001') rowObj[label] = "'" + feature.properties[name].toString();
        });

        //only do this if there are some results
        if (feature.properties.results.length > 0) {

          //console.log('HERE', feature.properties.results)
          resultCodes.forEach(function(resultCode) {

            var resultFound = false;
            var resultList = [];
            var label = codeLookup[resultCode];
            rowObj[label] = '';
            
            //for each result code search nested results for this feature
            feature.properties.results.forEach(function(result) {
              //console.log(result['C744'],resultCode)
              if (result['C744'] == resultCode) {

                rowObj[label] = result['C105'];
                
                //check if we already have this value key
                if (resultList.indexOf(result['C744'] ) !== -1) {
                  console.warn('Duplicate key found:',dupList.indexOf(feature.properties['C001']) , result['C744'], feature.properties['C001'])
                  if (dupList.indexOf(feature.properties['C001']) === -1) dupList.push(feature.properties['C001'])
                }

                //stash this result key
                resultList.push(result['C744'])

                resultFound = true;

                //push the actual value
                attributes.push(result['C105'])
              }
            });

            
  
            //if nothing was found push blank value
            if (!resultFound) attributes.push('');

          });
        }

        console.log('ROW OBJ', rowObj)

        csvData.push(Object.values(rowObj).join(','))

        //csvData.push(attributes);
    });

    csvData = csvData.join('\n');

    //console.log(csvData);
    console.log('dupList:',dupList)
    var filename = 'data.csv';
    downloadFile(csvData,filename);
  }
}

function downloadFile(data,filename) {
	var blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, filename);
	} else {
		var link = document.createElement('a');
		var url = URL.createObjectURL(blob);
		if (link.download !== undefined) { // feature detection
			// Browsers that support HTML5 download attribute
			link.setAttribute('href', url);
			link.setAttribute('download', filename);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
		else {
			window.open(url);
		}
	}
}

function flatten (obj, prefix, current) {
  prefix = prefix || []
  current = current || {}

  // Remember kids, null is also an object!
  if (typeof (obj) === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => {
      flatten(obj[key], prefix.concat(key), current)
    })
  } else {
    current[prefix.join('.')] = obj
  }

  return current
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '');
}