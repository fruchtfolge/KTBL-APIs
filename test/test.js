const ktbl = require('../index.js')

ktbl.procedure({
  procedureGroup: '3',
  procedure: '290',
  machCombination: '2493',
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
