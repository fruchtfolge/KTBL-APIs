const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const async = require('async');

module.exports = function cropProcedures(options) {
  return new Promise((resolve, reject) => {
    if (!options || !options.crop || !options.system || !options.type) reject('Minimum options are crop, type, and system')
    let results = []
    osmosis
      .get('https://daten.ktbl.de/vrpflanze/home.action')
      .find('div.aktionskastenUnten > a')
      .follow('@href')
      // farming type
      .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', {
        'selectedWirtschaftsart': options.type
      })
      .then(function(context, data, next) {
        data.cookie = context.request.headers['cookie'];
        next(context, data);
      })
      // crop
      .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action', {
        'selectedKulturpflanze': options.crop
      })
      .config('headers', {
        'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action'
      })
      // specifications
      .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadSpezifikationen.action', {
        'selectedAnbausystem': options.system
      })
      .config('headers', {
        'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action'
      })
      // plot size
      .then((context, data, next) => {
        if (options.size) {
          osmosis
            .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadMechanisierungOnUpdateSchlaggroesse.action', {
              'selectedSchlaggroesse': options.size
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
            })
            .then((context) => {
              next(context, data, next)
            })
        } else {
          next(context, data, next)
        }
      })
      // yield
      .then((context, data, next) => {
        if (options.yields) {
          osmosis
            .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadSpecificationsOnUpdateErtragsniveau.action', {
              'selectedSchlaggroesse': options.yields
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
            })
            .then((context) => {
              next(context, data, next)
            })
        } else {
          next(context, data, next)
        }
      })
      // mechanisation & distance
      .then((context, data, next) => {
        if (options.mechanisation && options.distance) {
          osmosis
            .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadResult.action', {
              'selectedMechanisierung': options.mechanisation,
              'selectedEntfernung': options.distance
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
            })
            .then((context) => {
              next(context, data, next)
            })
        } else {
          next(context, data)
        }
      })
      // scrape and get machine id's
      .then((context, data, next) => {
        const dom = new JSDOM(context);
        var rows = dom.window.document.querySelectorAll('#tab-1 > #avForm > div:nth-child(1) > table > tbody > tr:nth-child(n+4)');

        for (var i = 0; i < rows.length; i++) {
          var cells = rows[i].getElementsByTagName('td');
          var entries = {};

          if (rows[i].querySelector('.tabelleKoerperUo')) {
            entries.frequency = parseFloat(cells[1].getElementsByTagName('input')[0].value.replace(',', '.'));
            entries.month = cells[2].getElementsByTagName('select')[0].value;
            entries.name = cells[4].getElementsByTagName('b')[0].innerHTML.trim();
            if (cells[5].innerHTML.replace(/\t/g, '').replace(/\n/g, '') !== '') {
              entries.amount = cells[5].innerHTML.trim().replace(',', '.').replace(/\t/g, '').split('\n');
            } else {
              entries.amount = '';
            }
            entries.steps = [];
            var j = i + 1;
            while (rows[j].querySelector('.tabelleKoerperUo') === null && j < rows.length - 1 && rows[j].querySelector('.tabelleFuss') === null) {
              var cellsStep = rows[j].getElementsByTagName('td');
              var step = {};
              step.abr = cellsStep[3].innerHTML.trim();
              step.description = cellsStep[4].innerHTML.trim();
              step.time = parseFloat(cellsStep[6].innerHTML.trim().replace(',', '.'));
              step.fuelCons = parseFloat(cellsStep[7].innerHTML.trim().replace(',', '.'));
              step.deprec = parseFloat(cellsStep[8].innerHTML.trim().replace(',', '.'));
              step.interest = parseFloat(cellsStep[9].innerHTML.trim().replace(',', '.'));
              step.others = parseFloat(cellsStep[10].innerHTML.trim().replace(',', '.'));
              step.maintenance = parseFloat(cellsStep[11].innerHTML.trim().replace(',', '.'));
              step.lubricants = parseFloat(cellsStep[12].innerHTML.trim().replace(',', '.'));
              step.services = parseFloat(cellsStep[13].innerHTML.trim().replace(',', '.'));
              entries.steps.push(step);
              j++;
            }
            results.push(entries);
          }
        }

        // if option is set, get machine id's for each working step
        if (options.getIds) {
          const workingSteps = context.find('#avForm_checkedArbeitsvorgaenge').map((workingStep, index) => {
            return index
          })

          function getDetails(iteratee, callback) {
            data.workingStep = iteratee.toString()
            osmosis
              .post('https://daten.ktbl.de/vrpflanze/prodverfahren/editAv', {
                'checkedArbeitsvorgaenge': data.workingStep.toString(),
                'action:modifyAv': 'Arbeitsgang ersetzen'
              })
              .config('headers', {
                'cookie': data.cookie,
                'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/showResult.action'
              })
              .then((context) => {
                const dom = new JSDOM(context)

                const index = data.workingStep
                const procedureGroupNode = dom.window.document.getElementById('loadArbeitsverfahren_selectedGruppe')
                const procedureNameNode = dom.window.document.getElementById('loadMaschinenkombinationen_selectedArbeitsverfahren')
                const machCombinationNode = dom.window.document.getElementById('loadResult_selectedMaschinenkombination')


                if (!procedureNameNode) {
                  q.push(index, (err) => {
                    if (err) reject(err)
                  })
                  return setTimeout(() => {
                    return callback()
                  }, 2000);

                }

                const procedure = procedureNameNode.selectedOptions[0].text
                const procedureGroup = procedureGroupNode.selectedOptions[0].text
                const machCombination = machCombinationNode.selectedOptions[0].text

                const procedureId = procedureNameNode.selectedOptions[0].value
                const procedureGroupId = procedureGroupNode.selectedOptions[0].value
                const machCombinationId = machCombinationNode.selectedOptions[0].value

                results[index] = Object.assign({
                  'procedure': procedure,
                  'procedureGroup': procedureGroup,
                  'machCombination': machCombination,
                  'procedureId': procedureId,
                  'procedureGroupId': procedureGroupId,
                  'machCombinationId': machCombinationId
                }, results[index])
                return callback()
              })
          }

          const q = async.queue(getDetails, 1)

          q.drain = () => {
            return resolve(results)
          }

          results.forEach((workingStep, index) => {
            q.push(index, (err) => {
              if (err) return reject(err)
            })
          })

        } else {
          return resolve(results)
        }
      })
      .error(reject)
  })
}
