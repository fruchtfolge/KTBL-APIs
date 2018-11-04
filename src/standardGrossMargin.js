const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const fs = require('fs')
const { JSDOM } = jsdom

module.exports = {
  getSDB(crop,region) {
    let cropId
    return new Promise((resolve,reject) => {
      osmosis
        .get('https://daten.ktbl.de/sdb/welcome.do')
        .get('https://daten.ktbl.de/sdb/source.do')
        .get('https://daten.ktbl.de/sdb/source.do', {
          'selectedAction': 'merkmale',
          'selectedproduktionsZweig': 'Bodennutzung'
        })
        .then((context,data,next) => {
          const nodes = context.find('.falsefalse')
          const options = nodes.map(option => {
            return option.childNodes[0].textContent.trim()
          })
          
          console.log(options);
        })
        //ectedMerkmale=Weichweizen+und+Spelz&selectedAction=weiter
        .then(function(context, data, next) {
          const dom = new JSDOM(context)
          fs.writeFileSync('test.html', dom.serialize(), 'utf8')
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log)
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
      //console.log(part);
      if (crop.toUpperCase().includes(option.toUpperCase())) {
        result = option
      }
    })
    return result
  }
}
