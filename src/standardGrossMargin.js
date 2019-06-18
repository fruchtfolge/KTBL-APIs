const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const qs = require('querystring')
const jsdom = require('jsdom')
const fs = require('fs')
const { JSDOM } = jsdom

module.exports = {
  getSDB(crop,region) {
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
          else return resolve([])
        })
        .get((context, data) => `https://daten.ktbl.de/sdb/merkmale.do?selectedMerkmale=${data.encoded}&selectedAction=weiter` )
        .set('regions', ['.falsefalse'])
        .then((context,data,next) => {
          if (region) {
            data.regionString = `selectedRegion=${region}&`
          } else {
            data.regionString = ''
            data.regions = data.regions.forEach(region => {
              // dirty hack to replace malformed umlauts
              region = region.replace('Ã¶','ö').replace('Ã', 'ß').replace('Ã¼', 'ü').replace('Ã¤', 'ä').replace('Ã', 'Ö')
              region = region.replace('ß', '%DF').replace('ä', '%E4').replace('ö', '%F6').replace('ü', '%FC').replace('Ü', '%DC').replace(/\s/g, '+')
              data.regionString += `selectedRegion=${region}&`
            })
          }
          return next(context,data)
        })
        .get((context, data) => `https://daten.ktbl.de/sdb/regionen.do?${data.regionString}selectedAction=weiter` )
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
          data.results = data.results.concat(this.scrape(context, crop, data.match, region))
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
                  data.results = data.results.concat(that.scrape(ctx, crop, data.match))
                  return recurse(ctx)
                })
                //.log(console.log)
                //.error(console.log)
                //.debug(console.log)
            } else {
              next(ctx,data)
            }
          }

        })
        .then((context, data, next) => {
          //console.log('bla',data.results);
          resolve(data.results)
        })
        .error(err => {
          reject(err)
        })
        //.log(console.log)
        //.error(console.log)
        //.debug(console.log)
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
  scrape(context, crop, match) {
    const dom = new JSDOM(context)
    results = []

    const tbodys = dom.window.document.querySelectorAll('tbody')
    for (var i = 8; i < tbodys.length - 1; i++) {
      results.push({
        crop: crop,
        sdbCrop: match,
        year: Number(`20${tbodys[i].children[1].children[0].textContent.trim().split('/')[1]}`),
        region: tbodys[i].children[2].children[0].textContent.trim().replace('Ã¶','ö').replace('Ã', 'ß').replace('Ã¼', 'ü').replace('Ã¤', 'ä').replace('Ã', 'Ö'),
        mainProduct: {
          yield: Number(tbodys[i].children[1].children[2].textContent.trim().replace('.','').replace(',','.')),
          price: Number(tbodys[i].children[1].children[3].textContent.trim().replace('.','').replace(',','.')),
          revenue: Number(tbodys[i].children[1].children[4].textContent.trim().replace('.','').replace(',','.'))
        },
        byProduct: {
          yield: Number(tbodys[i].children[2].children[2].textContent.trim().replace('.','').replace(',','.')),
          price: Number(tbodys[i].children[2].children[3].textContent.trim().replace('.','').replace(',','.')),
          revenue: Number(tbodys[i].children[2].children[4].textContent.trim().replace('.','').replace(',','.'))
        },
        varCosts: {
          seeds: Number(tbodys[i].children[1].children[6].textContent.trim().replace('.','').replace(',','.')),
          fertilizer: Number(tbodys[i].children[2].children[6].textContent.trim().replace('.','').replace(',','.')),
          pesticides: Number(tbodys[i].children[3].children[5].textContent.trim().replace('.','').replace(',','.')),
          others: Number(tbodys[i].children[4].children[3].textContent.trim().replace('.','').replace(',','.'))
        },
        total: {
          sdb: Number(tbodys[i].children[5].children[1].textContent.trim().replace('.','').replace(',','.')),
          revenues: Number(tbodys[i].children[5].children[3].textContent.trim().replace('.','').replace(',','.')),
          varCosts: Number(tbodys[i].children[5].children[5].textContent.trim().replace('.','').replace(',','.'))
        }
      })
    }
    return results
  }
}
