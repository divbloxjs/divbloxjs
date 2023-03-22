const DxBaseDataSeries = require("divbloxjs/dx-orm/data-series-base");
const [EntityNamePascalCase] = require("../models/[EntityNameLowerCaseSplitted].model");

/**
 * Base [EntityNamePascalCase] entity Data series class.
 * To be used as a default when building any type of data series based on this entity.
 * Refer to DxDataSeriesBase for what functions you can override here
 */
class [EntityNamePascalCase]BaseDataSeries extends DxBaseDataSeries {
    constructor(dataSeriesConfig = {}, queryBuilderConfig = {}) {
        super(dataSeriesConfig, queryBuilderConfig);
    }

    async setFields() {
        this.fields = [[EntityNamePascalCase].id, [EntityAttributesStr]];
    }
}

module.exports = [EntityNamePascalCase]BaseDataSeries;