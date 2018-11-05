const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const qs = require('querystring')
const jsdom = require('jsdom')
const fs = require('fs')
const { JSDOM } = jsdom

module.exports = {
  getSDB(crop,region) {
    if (!region) {
      region = 'Deutschland'
    }
    return new Promise((resolve,reject) => {
      osmosis
        .get('https://daten.ktbl.de/sdb/welcome.do')
        .get('https://daten.ktbl.de/sdb/source.do')
        .get('https://daten.ktbl.de/sdb/source.do', {
          'selectedAction': 'merkmale',
          'selectedproduktionsZweig': 'Bodennutzung'
        })
        // get all possible crops
        .set('crops', ['.falsefalse'])
        .then((context,data,next) => {
          // dirty hack to replace malformed umlauts
          data.crops = data.crops.map(sdbCrop => {
            sdbCrop = sdbCrop.replace('Ã¶','ö').replace('Ã', 'ß').replace('Ã¼', 'ü').replace('Ã¤', 'ä').replace('Ã', 'Ö')
            return sdbCrop
          })
          data.match = this.mapCrop(crop, data.crops)
          // ktbl uses windows url encoding instead of utf8, therefore we can't use default methods
          // ä, ö, ü, ß, Ö and +
          data.encoded = data.match.replace('ß', '%DF').replace('ä', '%E4').replace('ö', '%F6').replace('ü', '%FC').replace('Ü', '%DC').replace(/\s/g, '+')
          data.results = []
          if (data.match) return next(context, data)
          else return reject(`No suitable SDB crop found for ${crop}`)
        })
        .get((context, data) => `https://daten.ktbl.de/sdb/merkmale.do?selectedMerkmale=${data.encoded}&selectedAction=weiter` )
        .get((context, data) => `https://daten.ktbl.de/sdb/regionen.do?selectedRegion=${qs.escape(region)}&selectedAction=weiter` ) 
        .set('years', ['.falsefalse'])
        .then((context,data,next) => { 
          data.yearQuery = ''
          data.years.forEach(year => {
            data.yearQuery += `selectedWiJahr=${qs.escape(year)}&`
          })
          return next(context,data)
        })
        .get((context, data) => `https://daten.ktbl.de/sdb/jahre.do?${data.yearQuery}selectedAction=weiter` )
        .get((context, data) => `https://daten.ktbl.de/sdb/sourceResult.do?selectedAction=Detailergebnis`)
        .then((context, data, next) => {
          data.headers = context.request.headers
          data.results.push(this.scrape(context, crop, data.match, region))
          const that = this
          recurse(context)
          // recursively scrape through sub-pages
          function recurse(ctx) {
            const arrow = ctx.find('input[name="selectedAction"][value=">"]')
            if (arrow.length > 0) {
              osmosis
                .get('https://daten.ktbl.de/sdb/sourceDResult.do?selectedAction=%3E')
                .config('headers', data.headers)
                .then(ctx => {
                  data.results.push(that.scrape(ctx, crop, data.match, region))
                  return recurse(ctx)
                })
            } else {
              return next(ctx,data)
            }
          }
          
        })
        .then((context, data, next) => {
          resolve(data.results)
        })
        .error(err => {
          reject(err)
        })
    })
  },
  mapCrop(crop, sdbOptions) {
    // check for some of the 'important' crops and make sure they are found
    if (crop.includes('Ackerbohnen') || crop.includes('Erbsen')) {
      crop = 'Eiweißpflanzen'
    } else if (crop.includes('Weizen') || crop.includes('weizen')) {
      crop = 'Weichweizen und Spelz'
    } else if (crop.includes('mais') && !crop.includes('Körnermais')) {
      crop = 'Grünmais (Silagemais)'
    }
    let result = ''
    sdbOptions.forEach(option => {
      if (crop.toUpperCase().includes(option.toUpperCase())) {
        result = option
      }
    })
    return result
  },
  scrape(context, crop, match, region) {
    const dom = new JSDOM(context)
    results = []
    
    const tbodys = dom.window.document.querySelectorAll('tbody')
    for (var i = 8; i < tbodys.length - 1; i++) {
      results.push({
        crop: crop,
        sdbCrop: match,
        year: Number(`20${tbodys[i].children[1].children[0].textContent.trim().split('/')[1]}`),
        region: region,
        mainProduct: {
          yield: Number(tbodys[i].children[1].children[2].textContent.trim().replace(',','.')),
          price: Number(tbodys[i].children[1].children[3].textContent.trim().replace(',','.')),
          revenue: Number(tbodys[i].children[1].children[4].textContent.trim().replace(',','.'))
        },
        byProduct: {
          yield: Number(tbodys[i].children[2].children[2].textContent.trim().replace(',','.')),
          price: Number(tbodys[i].children[2].children[3].textContent.trim().replace(',','.')),
          revenue: Number(tbodys[i].children[2].children[4].textContent.trim().replace(',','.'))
        },
        varCosts: {
          seeds: Number(tbodys[i].children[1].children[6].textContent.trim().replace(',','.')),
          fertilizer: Number(tbodys[i].children[2].children[6].textContent.trim().replace(',','.')),
          pesticides: Number(tbodys[i].children[3].children[5].textContent.trim().replace(',','.')),
          others: Number(tbodys[i].children[4].children[3].textContent.trim().replace(',','.'))
        },
        total: {
          sdb: Number(tbodys[i].children[5].children[1].textContent.trim().replace(',','.')),
          revenues: Number(tbodys[i].children[5].children[3].textContent.trim().replace(',','.')),
          varCosts: Number(tbodys[i].children[5].children[5].textContent.trim().replace(',','.'))
        }
      })
    }
    return results
  }
}
