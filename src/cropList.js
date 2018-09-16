const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const async = require('async');

module.exports = function cropList(options) {
  return new Promise((resolve, reject) => {
    let results = []
    osmosis
      .get('https://daten.ktbl.de/vrpflanze/home.action')
      .find('div.aktionskastenUnten > a')
      .follow('@href')
      // farming type
      .paginate({ selectedWirtschaftsart: '#loadKulturpflanze_selectedWirtschaftsart option:not(:first-child)'})
      .set('crops', ['#loadAnbausystem_selectedKulturpflanze option:not(:first-child)'])
      .data(res => {
        resolve(res)
      })
      .log(console.log)
      .error(console.log)
      .debug(console.log)
  })
}
