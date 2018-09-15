const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const fs = require('fs');

module.exports = function cropProcedures(options) {
  return new Promise ((resolve,reject) => {
    if (!options || !options.crop || !options.system || !options.type) reject('Minimum options are crop, type, and system')

    osmosis
      .get('https://daten.ktbl.de/vrpflanze/home.action')
      .find('div.aktionskastenUnten > a')
      .follow('@href')
      // farming type
      .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', {'selectedWirtschaftsart': options.type})
      .then(function(context,data,next) {
        data.cookie = context.request.headers['cookie'];
        next(context,data);
      })
      // crop
      .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action', {'selectedKulturpflanze': options.crop})
      .config( 'headers', {
        'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action'
      })
      // specifications
      .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadSpezifikationen.action', {'selectedAnbausystem': options.system})
      .config( 'headers', {
        'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action'
      })
      // plot size
      .then((context,data,next) => {
        if (options.size) {
          osmosis
          .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadMechanisierungOnUpdateSchlaggroesse.action', {'selectedSchlaggroesse': options.size})
          .config( 'headers', {
            'cookie': data.cookie,
            'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
          })
          .then((context,data,next) => {
            next(context,data,next)
          })
        } else {
          next(context,data,next)
        }
      })
      // yield
      .then((context,data,next) => {
        if (options.yields) {
          osmosis
          .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadSpecificationsOnUpdateErtragsniveau.action', {'selectedSchlaggroesse': options.yields})
          .config( 'headers', {
            'cookie': data.cookie,
            'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
          })
          .then((context,data,next) => {
            next(context,data,next)
          })
        } else {
          next(context,data,next)
        }
      })
      // mechanisation & distance
      .then((context,data,next) => {
        if (options.mechanisation && options.distance) {
          osmosis
          .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadResult.action', {'selectedMechanisierung': options.mechanisation, 'selectedEntfernung': options.distance})
          .config( 'headers', {
            'cookie': data.cookie,
            'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
          })
          .then((context,data,next) => {
            next(context,data,next)
          })
        } else {
          next(context,data,next)
        }
      })
      // scrape
      .then(function (context,data,next) {
        const dom = new JSDOM(context);
        var rows = dom.window.document.querySelectorAll('#tab-1 > #avForm > div:nth-child(1) > table > tbody > tr:nth-child(n+4)');
        var workingSteps = [];

        for (var i = 0; i < rows.length; i++) {
          var cells = rows[i].getElementsByTagName('td');
          var entries = {};

          if (rows[i].querySelector('.tabelleKoerperUo')) {
            entries.frequency = parseFloat(cells[1].getElementsByTagName('input')[0].value.replace(',','.'));
            entries.month = cells[2].getElementsByTagName('select')[0].value;
            entries.name = cells[4].getElementsByTagName('b')[0].innerHTML.trim();
            if (cells[5].innerHTML.replace(/\t/g,'').replace(/\n/g,'') !== '') {
              entries.amount = cells[5].innerHTML.trim().replace(',','.').replace(/\t/g,'').split('\n');
            }
            else {
              entries.amount = '';
            }
            entries.steps = [];
            var j = i+1;
            while (rows[j].querySelector('.tabelleKoerperUo') === null && j < rows.length -1 && rows[j].querySelector('.tabelleFuss') === null ) {
              var cellsStep = rows[j].getElementsByTagName('td');
              var step = {};
              step.abr = cellsStep[3].innerHTML.trim();
              step.description = cellsStep[4].innerHTML.trim();
              step.time = parseFloat(cellsStep[6].innerHTML.trim().replace(',','.'));
              step.fuelCons = parseFloat(cellsStep[7].innerHTML.trim().replace(',','.'));
              step.deprec = parseFloat(cellsStep[8].innerHTML.trim().replace(',','.'));
              step.interest = parseFloat(cellsStep[9].innerHTML.trim().replace(',','.'));
              step.others = parseFloat(cellsStep[10].innerHTML.trim().replace(',','.'));
              step.maintenance = parseFloat(cellsStep[11].innerHTML.trim().replace(',','.'));
              step.lubricants = parseFloat(cellsStep[12].innerHTML.trim().replace(',','.'));
              step.services = parseFloat(cellsStep[13].innerHTML.trim().replace(',','.'));
              entries.steps.push(step);
              j++;
            }
            workingSteps.push(entries);
          }
        }

        resolve(workingSteps)
        
      })
  })
}
