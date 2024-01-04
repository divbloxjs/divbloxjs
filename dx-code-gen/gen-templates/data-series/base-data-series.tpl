const DxBaseDataSeries = require("divbloxjs/dx-core-modules/data-series-base");
// TODO update to local version of model class
const [EntityNamePascalCase] = require("../models/[EntityNameLowerCaseSplitted].model-base");

/**
 * Base [EntityNamePascalCase] entity Data series class.
 * To be used as a default when building any type of data series based on this entity.
 * Refer to DxDataSeriesBase for what functions you can override here
 * @extends DxBaseDataSeries
 */
class [EntityNamePascalCase]BaseDataSeries extends DxBaseDataSeries {
    constructor(dxInstance, dataSeriesConfig = {}, additionalParams = {}) {
        dataSeriesConfig.moduleName = [EntityNamePascalCase].__moduleName;
        dataSeriesConfig.entityName = [EntityNamePascalCase].__entityName;
        dataSeriesConfig.RELATIONSHIP_TREE_LIMIT = 3;

        // Keep empty to include all fields
        dataSeriesConfig.includedAttributes = [];

        // Update to filter which attributes get searched on
        dataSeriesConfig.searchAttributes = [];

        super(dxInstance, dataSeriesConfig, additionalParams);
    }
    [relationshipConstraints]
}

module.exports = [EntityNamePascalCase]BaseDataSeries;