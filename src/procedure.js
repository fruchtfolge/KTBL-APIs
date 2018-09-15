const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

module.exports = function procedure(options) {
  return new Promise((resolve, reject) => {
    if (!options || !options.procedureGroupId || !options.procedureId || !options.machCombinationId) reject('Minimum options are procedureGroup, procedure, and machCombination')

    // populate options with default values if omitted
    options = Object.assign({
      size: options.size || '2',
      resistance: options.resistance || '',
      distance: options.distance || '2',
      amount: options.amount || '',
      workingWidth: options.workingWidth || '',
    }, options)

    osmosis
      .get('https://daten.ktbl.de/feldarbeit/home.html')
      .post('https://daten.ktbl.de/feldarbeit/entry.html', {
        'state': '1'
      })
      .config('headers', {
        'referer': 'https://daten.ktbl.de/feldarbeit/home.html'
      })
      .then(function(context, data, next) {
        data.cookie = context.request.headers['cookie']
        next(context, data)
      })
      // Procedure Group (Verfahrensgruppe)
      .post('https://daten.ktbl.de/feldarbeit/entry.html', {
        'hgId': options.procedureGroupId,
        'state': '2'
      })
      // Procedure (Arbeitsverfahren)
      .post('https://daten.ktbl.de/feldarbeit/entry.html', {
        'gId': options.procedureId,
        'state': '3'
      })
      // Maschinenkombination
      .post('https://daten.ktbl.de/feldarbeit/entry.html', {
        'avId': options.machCombinationId,
        'state': '4'
      })
      // Detailed options
      .post('https://daten.ktbl.de/feldarbeit/entry.html', {
        'flaecheID': options.size,
        'bodenID': options.resistance,
        'hofID': options.distance,
        'mengeID': options.amount,
        'arbeit': options.workingWidth,
        'state': '5'
      })
      // scrape
      .then((context, data, next) => {
        const dom = new JSDOM(context)
        const rows = dom.window.document.querySelectorAll('#tabs-2 > table > tbody > tr')
        const procedureGroupNode = dom.window.document.getElementsByName('hgId')[0]
        const procedureNameNode = dom.window.document.getElementsByName('gId')[0]
        const machCombinationNode = dom.window.document.getElementsByName('avId')[0]


        if (!procedureNameNode) return reject('Error in request, possibly query parameters dont match')
        const procedure = procedureNameNode.selectedOptions[0].text
        const procedureGroup = procedureGroupNode.selectedOptions[0].text
        const machCombination = machCombinationNode.selectedOptions[0].text

        if (procedure.includes('Dienstleistung')) {
          dienstleistung.push(item)
        }

        if (rows.length > 3) {
          var steps = []

          for (var i = 3; i < rows.length; i++) {
            var cells = rows[i].getElementsByTagName('td')
            if (cells.length < 10) {
              next(context, data)
              break
            }
            var step = {}

            step.description = cells[0].innerHTML.trim()
            step.name = cells[1].innerHTML.trim()
            step.time = parseFloat(cells[2].innerHTML.trim().replace(',', '.'))
            step.areaOutput = parseFloat(cells[3].innerHTML.trim().replace(',', '.'))
            step.deprec = parseFloat(cells[4].innerHTML.trim().replace(',', '.'))
            step.interest = parseFloat(cells[5].innerHTML.trim().replace(',', '.'))
            step.others = parseFloat(cells[6].innerHTML.trim().replace(',', '.'))
            step.maintenance = parseFloat(cells[7].innerHTML.trim().replace(',', '.'))
            step.lubricants = parseFloat(cells[8].innerHTML.trim().replace(',', '.'))
            step.fuelCons = parseFloat(cells[9].innerHTML.trim().replace(',', '.'))
            step.abr = ''
            step.amount = parseFloat(options.amount.replace(',', '.'))
            step.workingWidth = parseFloat(options.workingWidth.replace(',', '.'))

            steps.push(step)
          }

          resolve({
            'procedureId': options.procedureId,
            'machCombinationId': options.machCombinationId,
            'machCombination': machCombination,
            'size': options.size,
            'resistance': options.resistance,
            'distance': options.distance,
            'amount': options.amount,
            'workingWidth': options.workingWidth,
            'name': procedure,
            'procedureGroupId': options.procedureGroupId,
            'procedureGroup': procedureGroup,
            'steps': steps
          })
        } else {
          reject('No information for given query')
        }
      })
  })
}
