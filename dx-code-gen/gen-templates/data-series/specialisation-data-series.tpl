const [EntityNamePascalCase]DataSeriesBase = require("divbloxjs/dx-code-gen/generated-base/[EntityNameKebabCase]/[EntityNameKebabCase].data-series-base");

/**
 * Specialisation [EntityNamePascalCase] entity data series class
 * To be extended as needed
 * Refer to DxDataSeriesBase for what functions you can override here
 * @extends [EntityNamePascalCase]DataSeriesBase
 */
class [EntityNamePascalCase]DataSeries extends [EntityNamePascalCase]DataSeriesBase {
    constructor(dxInstance, dataSeriesConfig = {}, additionalParams = {}) {
        // Keep empty to include all fields
        dataSeriesConfig.includedAttributes ? dataSeriesConfig?.includedAttributes : [];

        // Update to filter which attributes get searched on
        // dataSeriesConfig.searchAttributes = [];

        super(dxInstance, dataSeriesConfig, additionalParams);
    }
}

module.exports = [EntityNamePascalCase]DataSeries;