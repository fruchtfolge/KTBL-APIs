const assert = require('assert')
const fs = require('fs')
const ktbl = require('../index.js')


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
  // fs.writeFileSync('test/results/procedure.json', JSON.stringify(result), 'utf-8')
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
  //fs.writeFileSync('test/results/cropProcedures.json', JSON.stringify(result), 'utf-8')
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
  //fs.writeFileSync('test/results/cropProceduresIds.json', JSON.stringify(result), 'utf-8')
  const comparison = JSON.parse(fs.readFileSync('test/results/cropProceduresIds.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

// test to get all available farming types
ktbl.cropList()
.then(result => {
  assert.deepStrictEqual(['konventionell/integriert', 'ökologisch'], result)
})
.catch(err => {
  console.log(err)
})

// test to get all available crops for a farming type
ktbl.cropList({
  farmingType: 'ökologisch'
})
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/cropList.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

// test to get all available systems for a crop of a farming type
ktbl.cropList({
  farmingType: 'ökologisch',
  crop: 'Ackerbohnen - Erbsen - Gemenge'
})
.then(result => {
  assert.deepStrictEqual(['nichtwendend, ohne Düngung', 'wendend, ohne Düngung'], result)
})
.catch(err => {
  console.log(err)
})

// test to get all available settings for a crop, system, and farming type
ktbl.cropList({
  farmingType: 'ökologisch',
  crop: 'Ackerbohnen - Erbsen - Gemenge',
  system: 'nichtwendend, ohne Düngung'
})
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/cropListSpecifiction.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

// Query default KTBL contribution margin for a crop
ktbl.contributionMargin({
  farmingType: 'ökologisch',
  crop: 'Ackerbohnen - Erbsen - Gemenge',
  system: 'nichtwendend, ohne Düngung'
})
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/contributionMargin.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

// Query standard gross margin for a crop
ktbl.standardGrossMargin('Ackerbohnen - Erbsen - Gemenge')
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/standardGrossMarginRegions.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})

ktbl.standardGrossMargin('Ackerbohnen - Erbsen - Gemenge', 'Deutschland')
.then(result => {
  const comparison = JSON.parse(fs.readFileSync('test/results/standardGrossMargin.json','utf-8'))
  assert.deepStrictEqual(comparison, result)
})
.catch(err => {
  console.log(err)
})
