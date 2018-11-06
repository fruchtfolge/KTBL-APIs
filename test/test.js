const assert = require('assert')
const fs = require('fs')
const ktbl = require('../index.js')

/*
// Query a single working step
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
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/procedure.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

// Query crop procedures
ktbl.cropProcedures({
  'crop': 'Ackergras - Anwelksilage',
  'type': 'konventionell/integriert',
  'system': 'Ballen'
})
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/cropProcedures.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

// Query crop procedures with internal KTBL IDs for each working step - takes significantly longer!
ktbl.cropProcedures({
  'crop': 'Ackergras - Anwelksilage',
  'type': 'konventionell/integriert',
  'system': 'Ballen',
  'getIds': true
})
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/cropProceduresIds.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})
*/

/*
ktbl.cropList()
.then(res => {
  console.log(res)
})
.catch(err => {
  console.log(err)
})


ktbl.cropList.detail('ökologisch')
.then(res => {
  console.log(res)
})
.catch(err => {
  console.log(err)
})

ktbl.cropList('ökologisch', 'Ackerbohnen - Erbsen - Gemenge')
.then(res => {
  console.log(res)
})
.catch(err => {
  console.log(err)
})

ktbl.cropList()
.then(res => {
  console.log(res)
})
.catch(err => {
  console.log(err)
})
*/

ktbl.contributionMargin('ökologisch', 'Ackerbohnen - Erbsen - Gemenge', 'nichtwendend, ohne Düngung')
.then(result => {
  console.log(result);
  const comparison = JSON.parse(fs.readFileSync('test/results/contributionMargin.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})


/*
ktbl.standardGrossMargin.getSDB('Ackerbohnen - Erbsen - Gemenge')
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/standardGrossMargin.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})
*/
