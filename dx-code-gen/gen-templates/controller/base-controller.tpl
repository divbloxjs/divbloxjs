const PackageControllerBase = require('divbloxjs/dx-core-modules/package-controller-base');
const [EntityNamePascalCase] = require('../models/[EntityNameLowerCaseSplitted].model-base');
const [EntityNamePascalCase]DataSeries = require('../../../../../divblox-packages-local/[PackageNameKebabCase]/data-series/[EntityNameLowerCaseSplitted].data-series');

class [EntityNamePascalCase]ControllerBase extends PackageControllerBase {
    constructor(dxInstance = null, packageName = '[PackageNameCamelCase]') {
        super(dxInstance, packageName);
    }

    async get[EntityNamePascalCasePlural](dataSeriesConfig = {}, additionalParams = {}) {
        const [EntityNameCamelCase]DataSeries = new [EntityNamePascalCase]DataSeries(
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

    async get[EntityNamePascalCase](id = null, additionalParams = {}) {
        additionalParams.[EntityNameCamelCase]Id = id;
        
        const [EntityNameCamelCase]DataSeries = new [EntityNamePascalCase]DataSeries(
            this.dxInstance, {}, additionalParams,
        );

        const data = await [EntityNameCamelCase]DataSeries.getDataSeries();
        if (data === null) {
            [EntityNameCamelCase]DataSeries.printLastError();
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return null;
        }

        return data[0];
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