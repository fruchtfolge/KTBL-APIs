const cropList = require('./src/cropList')
const procedure = require('./src/procedure')
const cropProcedures = require('./src/cropProcedures')
const contributionMargin = require('./src/contributionMargin')
const standardGrossMargin = require('./src/standardGrossMargin')

module.exports = {
  async cropList(farmingType, crop, system) {
    if (!farmingType && !crop && !system) {
      return ['konventionell/integriert', 'ökologisch']
    } else if (farmingType && !crop && !system) {
      const crops = await cropList.getCrops(farmingType)
      return crops
    } else if (farmingType && crop && !system) {
      const systems = await cropList.getSystemsForCrop(farmingType, crop)
      return systems
    } else if (farmingType && crop && system) {
      const specifications = await cropList.getSpecificationsForCrop(farmingType, crop, system)
      return specifications
    } else {
      throw new Error('User request error.')
    }
  },
  procedure,
  cropProcedures,
  contributionMargin(farmingType, crop, system) {
    return contributionMargin.getKTBLcontributionMargin(farmingType, crop, system)
  },
  standardGrossMargin
}
