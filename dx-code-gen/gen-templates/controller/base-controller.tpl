const PackageControllerBase = require('divbloxjs/dx-core-modules/package-controller-base');
const [EntityNamePascalCase] = require('../models/[EntityNameLowerCaseSplitted].model-base');
const [EntityNamePascalCase]DataSeries = require('../data-series/[EntityNameLowerCaseSplitted].data-series-base');

class [EntityNamePascalCase]ControllerBase extends PackageControllerBase {
    constructor(dxInstance = null, packageName = '[PackageNameLowerCaseSplitted]') {
        super(dxInstance, packageName);
    }

    async get[EntityNamePascalCase]s(dataSeriesConfig = {}, additionalParams = {}) {
        const [EntityNameCamelCase]DataSeries = await new [EntityNamePascalCase]DataSeries(
            this.dxInstance, dataSeriesConfig, additionalParams,
        );

        const data = await [EntityNameCamelCase]DataSeries.getDataSeries();
        if (data === null) {
            [EntityNameCamelCase]DataSeries.printLastError();
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return { data: null, count: null };
        }

        const count = await [EntityNameCamelCase]DataSeries.getTotalCount();
        if (count === null) {
            [EntityNameCamelCase]DataSeries.printLastError();
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return { data: null, count: null };
        }

        return { data: data, count: count };
    }

    async get[EntityNamePascalCase](id, additionalParams) {
        return {};
    }

    async create[EntityNamePascalCase]([EntityNameCamelCase]Data, additionalParams) {
        return {};
    }

    async patch[EntityNamePascalCase](id, [EntityNameCamelCase]Data, additionalParams) {
        return {};
    }

    async delete[EntityNamePascalCase](id, additionalParams) {
        return {};
    }
}

module.exports = [EntityNamePascalCase]ControllerBase;