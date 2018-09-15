const ktbl = require('../index.js')

/*
ktbl.procedure({
  procedureGroupId: '3',
  procedureId: '290',
  machCombinationId: '2493',
  size: '1',
  resistance: 'leicht',
  distance: '1',
  amount: '130.0',
  workingWidth: '4.0',
})
.then(res => {
  console.log(res)
})
.catch(err => {
  console.log(err)
})
*/
ktbl.cropProcedures({
  'crop': 'Ackergras - Anwelksilage',
  'type': 'konventionell/integriert',
  'system': 'Ballen',
  'getIds': true
})
.then(res => {
  console.log(res)
})
.catch(err => {
  console.log(err)
})
