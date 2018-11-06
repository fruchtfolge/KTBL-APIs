const osmosis = require('osmosis')
const async = require('async')

module.exports = {
  async getCrops(farmingType) {
    return new Promise(resolve => {
      osmosis
        .get('https://daten.ktbl.de/vrpflanze/home.action')
        .find('div.aktionskastenUnten > a')
        .follow('@href')
        .then(function(context, data, next) {
          data.cookie = context.request.headers['cookie'];
          next(context, data);
        })
        // farming type
        .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', {
          'selectedWirtschaftsart': farmingType
        })
        .set('crops', ['#loadAnbausystem_selectedKulturpflanze option:not(:first-child)'])
        .then((context, data) => {
          const res = data.crops.map(crop => {
            return crop
          })
          resolve(res)
        })
    })
  },

  async getSystemsForCrop(farmingType,crop) {
    return new Promise(resolve => {
      osmosis
        .get('https://daten.ktbl.de/vrpflanze/home.action')
        .find('div.aktionskastenUnten > a')
        .follow('@href')
        .then(function(context, data, next) {
          data.cookie = context.request.headers['cookie'];
          next(context, data);
        })
        // farming type
        .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', {
          'selectedWirtschaftsart': farmingType
        })
        .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action', {
          'selectedKulturpflanze': crop
        })
        .config('headers', {
          'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action'
        })
        .set('systems', ['#loadSpezifikationen_selectedAnbausystem option:not(:first-child)'])
        .then((context, data) => {
          const res = data.systems.map(system => {
            return system
          })
          resolve(res)
        })
    })
  },

  async getSpecificationsForCrop(farmingType,crop,system) {
    return new Promise(resolve => {
      osmosis
        .get('https://daten.ktbl.de/vrpflanze/home.action')
        .find('div.aktionskastenUnten > a')
        .follow('@href')
        .then(function(context, data, next) {
          data.cookie = context.request.headers['cookie'];
          next(context, data);
        })
        // farming type
        .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action', {
          'selectedWirtschaftsart': farmingType
        })
        .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action', {
          'selectedKulturpflanze': crop
        })
        .config('headers', {
          'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadKulturpflanze.action'
        })
        .post('https://daten.ktbl.de/vrpflanze/prodverfahren/loadSpezifikationen.action', {
        'selectedAnbausystem': system
        })
        .config('headers', {
          'referer': 'https://daten.ktbl.de/vrpflanze/prodverfahren/loadAnbausystem.action'
        })
        .set('sizes', ['#loadMechanisierungOnUpdateSchlaggroesse_selectedSchlaggroesse option:not(:first-child)'])
        .set('yields', ['#loadSpecificationsOnUpdateErtragsniveau_selectedErtragsniveau option:not(:first-child)'])
        .set('mechanisations', ['#loadResult_selectedMechanisierung option:not(:first-child)'])
        .set('distances', ['#loadResult_selectedEntfernung option:not(:first-child)'])
        .then((context, data) => {
          const res = []
          data.sizes.forEach(size => {
            data.yields.forEach(yieldLevel => {
              data.mechanisations.forEach(mechanisation => {
                data.distances.forEach(distance => {
                  res.push({
                    type: farmingType,
                    crop: crop,
                    system: system,
                    size: size,
                    yield: yieldLevel,
                    mechanisation: mechanisation,
                    distance: distance,
                    getIds: true
                  })
                })
              })
            })
          })

          resolve(res)
        })
    })
  }
}
