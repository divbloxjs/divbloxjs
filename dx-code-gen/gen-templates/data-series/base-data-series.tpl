const DxBaseDataSeries = require("divbloxjs/dx-core-modules/data-series-base");
const [EntityNamePascalCase] = require("../../../../../divblox-packages-local/[PackageNameKebabCase]/[EntityNameKebabCase]/[EntityNameKebabCase].model");

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

        if (!dataSeriesConfig.hasOwnProperty("searchAttributes")) {
[SearchAttributesStr]
        }

        super(dxInstance, dataSeriesConfig, additionalParams);
    }
    [relationshipConstraints]
}

module.exports = [EntityNamePascalCase]BaseDataSeries;