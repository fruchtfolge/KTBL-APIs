const osmosis = require('osmosis')
const libxmljs = require('libxmljs-dom')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const async = require('async')
const fs = require('fs')

module.exports = function cropList(options) {
  return new Promise((resolve, reject) => {
    let results = []
    osmosis
      .get('https://daten.ktbl.de/vrpflanze/home.action')
      .find('div.aktionskastenUnten > a')
      .follow('@href')
      // farming type
      .click('#loadKulturpflanze_selectedWirtschaftsart')
      .click('#loadKulturpflanze_selectedWirtschaftsart option:nth-child(2)')
      .then((window, data, next) => {
        console.log(window)
      })
      //.click('#loadAnbausystem_selectedKulturpflanze option:not(:first-child)')
      //.post('http://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', { selectedWirtschaftsart: '#loadKulturpflanze_selectedWirtschaftsart option:not(:first-child)'})
      //.then((context,data,next) => {
      //  const dom = new JSDOM(context);
      //  fs.writeFileSync('test.html',dom.window.document.documentElement.outerHTML,'utf-8')
      //})
      //.set('crops', ['#loadAnbausystem_selectedKulturpflanze option:not(:first-child)'])
      //.data(res => {
      //  resolve(res)
      //})
      .log(console.log)
      .error(console.log)
      .debug(console.log)
  })
}
