const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const fs = require('fs')

module.exports = {
  procedure(options) {
    return new Promise((resolve, reject) => {
      if (!options || !options.procedureGroup || !options.procedure || !options.machCombination) reject('No options')

      // populate options with default values if omitted
      options = Object.assign({
        size: options.size || '',
        resistance: options.resistance || '',
        distance: options.distance || '',
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
        // Verfahrensgruppe
        .then(function(context, data, next) {
          osmosis
            .post('https://daten.ktbl.de/feldarbeit/entry.html', {
              'hgId': options.procedureGroup,
              'state': '2'
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/feldarbeit/entry.html'
            })
            .then(function(context) {
              const dom = new JSDOM(context)
              fs.writeFileSync('test1.html',dom.window.document.documentElement.outerHTML,'utf-8')
              next(context, data)
            })
            .error(reject)
        })
        // Arbeitsverfahren
        .then(function(context, data, next) {
          osmosis
            .post('https://daten.ktbl.de/feldarbeit/entry.html', {
              'gId': options.procedure,
              'state': '3'
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/feldarbeit/entry.html'
            })
            .then(function(context) {
              const dom = new JSDOM(context)
              fs.writeFileSync('test2.html',dom.window.document.documentElement.outerHTML,'utf-8')
              next(context, data)
            })
            .error(reject)
        })
        // Maschinenkombination
        .then(function(context, data, next) {
          osmosis
            .post('https://daten.ktbl.de/feldarbeit/entry.html', {
              'avId': options.machCombination,
              'state': '4'
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/feldarbeit/entry.html'
            })
            .then(function(context) {
              const dom = new JSDOM(context)
              fs.writeFileSync('test3.html',dom.window.document.documentElement.outerHTML,'utf-8')
              next(context, data)
            })
            .error(reject)
        })
        .then(function(context, data, next) {
          osmosis
            .post('https://daten.ktbl.de/feldarbeit/entry.html', {
              'flaecheID': options.size,
              'bodenID': options.resistance,
              'hofID': options.distance,
              'mengeID': options.amount,
              'arbeit': options.workingWidth,
              'state': '5'
            })
            .config('headers', {
              'cookie': data.cookie,
              'referer': 'https://daten.ktbl.de/feldarbeit/entry.html'
            })
            .then(function(context) {
              const dom = new JSDOM(context)
              fs.writeFileSync('test4.html',dom.window.document.documentElement.outerHTML,'utf-8')
              next(context, data)
            })
            .error(reject)
        })
        // prepare HTML file
        .then(function(context, data, next) {
          const dom = new JSDOM(context)
          var html = dom.window.document.documentElement.outerHTML
          var contextObject = libxmljs.parseHtml(html)
          next(contextObject, data)
        })
        // scrape
        .then(function(context, data, next) {
          const dom = new JSDOM(context)
          const rows = dom.window.document.querySelectorAll('#tabs-2 > table > tbody > tr')
          const procedureNameNode = dom.window.document.getElementsByName('gId')[0]
          if (!procedureNameNode) return reject('Error in request')
          const procedureName = procedureNameNode.selectedOptions[0].text
          if (procedureName.includes('Dienstleistung')) {
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
              'procedure': options.procedure,
              'machCombination': options.machCombination,
              'size': options.size,
              'resistance': options.resistance,
              'distance': options.distance,
              'amount': options.amount,
              'workingWidth': options.workingWidth,
              'name': procedureName,
              'procedureGroup': options.procedureGroup,
              'frequency': null,
              'month': null,
              'steps': steps
            })
          } else {
            reject('No information for given query')
          }
        })
    })
  }
}
