const cropList = require('./src/cropList')
const procedure = require('./src/procedure')
const cropProcedures = require('./src/cropProcedures')
const contributionMargin = require('./src/contributionMargin')
const standardGrossMargin = require('./src/standardGrossMargin')

module.exports = {
  async cropList(options) {
    if (!options) {
      return ['konventionell/integriert', 'ökologisch']
    } else if (options.farmingType && !options.crop && !options.system) {
      const crops = await cropList.getCrops(options.farmingType)
      return crops
    } else if (options.farmingType && options.crop && !options.system) {
      const systems = await cropList.getSystemsForCrop(options.farmingType, options.crop)
      return systems
    } else if (options.farmingType && options.crop && options.system) {
      const specifications = await cropList.getSpecificationsForCrop(options.farmingType, options.crop, options.system)
      return specifications
    } else {
      throw new Error('User request error.')
    }
  },
  procedure,
  cropProcedures,
  contributionMargin(options) {
    if (!options) {
      return new Error('No options')
    }
    return contributionMargin.getKTBLcontributionMargin(options.farmingType, options.crop, options.system)
  },
  standardGrossMargin(crop, region) {
    if (!crop) {
      return new Error('No crop')
    }
    return standardGrossMargin.getSDB(crop, region)
  }
}
