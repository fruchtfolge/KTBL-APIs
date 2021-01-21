const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const fs = require('fs')
const { JSDOM } = jsdom

module.exports = {
  getKTBLcontributionMargin(type, crop, system, size, distance, mechanisation) {
    let cropId, cookie
    return new Promise((resolve,reject) => {
      osmosis
          .get('http://daten.ktbl.de/dslkrpflanze/?tx_ktblsso_checktoken[token]=')
          .then((context, data, next) => {
            cookie = context.request.headers['cookie'];
            next(context, data);
          })
          .post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
            'state': 10,
            'selectedKulturgruppen': 'Alle'
          })
          .post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
            'state': 1,
            'cultivation': type
          })
          .post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
            'state': 2,
            'cropId': crop
          })
          .then((context, data, next) => {
            const dom = new JSDOM(context)
            const selector = dom.window.document.getElementsByName('cropSysId')[0]
            if (!selector) return reject('No data available for ' + crop)
            const systems = selector.children
            for (var i = 0; i < systems.length; i++) {
              if (systems[i].innerHTML === system) {
                cropId = Number(systems[i].value)
              }
            }
            return osmosis.post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
              'state': 8,
              'cropSysId': cropId
            })
            .config('headers', {
                'cookie': cookie
            })
            .then(next)
          })
          .then((context,data,next) => {
            if (size) {
              osmosis.post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
                'areaSize': size,
                'state': 9,
                'refineSelection': true
              })
              .config('headers', {
                'cookie': cookie,
                'referer': 'https://daten.ktbl.de/dslkrpflanze/postHv.html'
              })
              .then(next)
            } else {
              next(context, data)
            }
          })
          .then((context,data,next) => {
            if (mechanisation) {
              osmosis.post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
                'mechanics': mechanisation,
                'state': 4,
                'refineSelection': true
              })
              .config('headers', {
                'cookie': cookie,
                'referer': 'https://daten.ktbl.de/dslkrpflanze/postHv.html'
              })
              .then(next)
            } else {
              next(context, data)
            }
          })
          .then((context,data,next) => {
            if (distance) {
              osmosis.post('https://daten.ktbl.de/dslkrpflanze/postHv.html', {
                'distance': distance,
                'state': 4,
                'refineSelection': true
              })
              .config('headers', {
                'cookie': cookie,
                'referer': 'https://daten.ktbl.de/dslkrpflanze/postHv.html'
              })
              .then(next)
            } else {
              next(context, data, next)
            }
          })
          .then((context) => {
            const dom = new JSDOM(context);
            const data = this.scrape(dom.window.document)
            resolve(data)
          })
    })
  },
  scrape(document) {
    // get contribution margin table
    const div = document.getElementById('tabs-1')
    if (!div) return
    const table = div.children[1]
    if (!table) return
    const tbody = table.children[1]
    if (!tbody) return
    const rows = tbody.children

    if (!rows) return
    // split into main sections
    const end_points = []
    for (var i = 0; i < rows.length; i++) {
      if(rows[i].children.length === 3) {
        end_points.push(i)
      }
    }
    if (end_points.length !== 7) return

    const contribution_margin = {}

    contribution_margin.revenues = []
    contribution_margin.directCosts = []
    contribution_margin.variableCosts = []
    contribution_margin.fixCosts = []
    
    // get number of rows
    const kea_rows = document.querySelector('#tabs-4 > table > tbody').children.length
    contribution_margin.diesel = Number(document.querySelector(`#tabs-4 > table > tbody > tr:nth-child(${kea_rows}) > td:nth-child(7)`).innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.'))
    
    contribution_margin.energyReq = {
      operatingMaterials: Number(document.querySelector(`#tabs-4 > table > tbody > tr:nth-child(${kea_rows}) > td:nth-child(8)`).innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.')),
      operatingResources: Number(document.querySelector(`#tabs-4 > table > tbody > tr:nth-child(${kea_rows}) > td:nth-child(9)`).innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.')),
      machinesBuildings: Number(document.querySelector(`#tabs-4 > table > tbody > tr:nth-child(${kea_rows}) > td:nth-child(10)`).innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.')),
      sum: Number(document.querySelector(`#tabs-4 > table > tbody > tr:nth-child(${kea_rows}) > td:nth-child(11)`).innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.'))
    }
    // Leistungen
    for (var i = 1; i < end_points[0]; i++) {
      save(i, 'revenues')
    }
    // Direktkosten
    for (var i = end_points[0] + 1; i < end_points[1]; i++) {
      save(i, 'directCosts')
    }
    // variable costs
    for (var i = end_points[2] + 1; i < end_points[3]; i++) {
      save(i, 'variableCosts')
    }
    // fix costs
    for (var i = end_points[4] + 1; i < end_points[5]; i++) {
      save(i,'fixCosts')
    }

    function save(i, type) {
      const td = rows[i].children
      if(td[5].innerHTML.trim() === '') return
      data = {
        name: td[0].innerHTML.trim(),
        amount: {
          value: Number(td[1].innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.')),
          unit: td[2].innerHTML.trim()
        },
        price: {
          value: Number(td[3].innerHTML.replace(/&nbsp;/g, ' ').trim().replace('.','').replace(',','.')),
          unit: td[4].innerHTML.trim()
        },
        total: {
          value: Number(td[5].innerHTML.trim().replace(/&nbsp;/g, ' ').split(/\s/)[0].replace('.','').replace('.','').replace(',','.')),
          unit: td[5].innerHTML.trim().replace(/&nbsp;/g, ' ').split(/\s/)[1]
        }
      }
      contribution_margin[type].push(data)
    }
    return contribution_margin
  }
}
