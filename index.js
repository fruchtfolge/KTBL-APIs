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
      return await cropList.getCrops(options.farmingType)
    } else if (options.farmingType && options.crop && !options.system) {
      return await cropList.getSystemsForCrop(options.farmingType, options.crop)
    } else if (options.farmingType && options.crop && options.system) {
      return await cropList.getSpecificationsForCrop(options.farmingType, options.crop, options.system)
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
    return contributionMargin.getKTBLcontributionMargin(options.farmingType, options.crop, options.system, options.size, options.distance, options.mechanisation)
  },
  standardGrossMargin(crop, region) {
    if (!crop) {
      return new Error('No crop')
    }
    return standardGrossMargin.getSDB(crop, region)
  }
}
