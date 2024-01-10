const PackageControllerBase = require('divbloxjs/dx-core-modules/package-controller-base');
const [EntityNamePascalCase] = require('../../../../../divblox-packages-local/[PackageNameKebabCase]/[EntityNameLowerCaseSplitted]/[EntityNameLowerCaseSplitted].model');
const [EntityNamePascalCase]DataSeries = require('../../../../../divblox-packages-local/[PackageNameKebabCase]/[EntityNameLowerCaseSplitted]/[EntityNameLowerCaseSplitted].data-series');
[ShowRelationshipDeclarations]
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
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return { data: null, count: null };
        }

        const count = await [EntityNameCamelCase]DataSeries.getTotalCount();
        if (count === null) {
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return { data: null, count: null };
        }

        return { data: data, count: count };
    }

    async get[EntityNamePascalCase](id = null, showRelationshipOptions = false, additionalParams = {}) {
        additionalParams.[EntityNameCamelCase]Id = id;
        
        const [EntityNameCamelCase]DataSeries = new [EntityNamePascalCase]DataSeries(
            this.dxInstance, {}, additionalParams,
        );

        const [EntityNameCamelCase]DataArr = await [EntityNameCamelCase]DataSeries.getDataSeries();
        if ([EntityNameCamelCase]DataArr === null) {
            this.populateError([EntityNameCamelCase]DataSeries.getLastError());
            return null;
        }

        if (!showRelationshipOptions) {
            return [EntityNameCamelCase]DataArr[0];
        }

[RelationshipOptions]
        return {
            data: [EntityNameCamelCase]DataArr[0],
[RelationshipReturnOptions]        };
    }

    async create[EntityNamePascalCase]([EntityNameCamelCase]Data = {}, additionalParams = {}) {
        const [EntityNameCamelCase] = new [EntityNamePascalCase](this.dxInstance);

        Object.keys([EntityNameCamelCase]Data).forEach((attributeName) => {
            if (![EntityNamePascalCase].userEditableFields.includes(attributeName)) {
                this.populateError(`Invalid attribute provided: ${attributeName}`);
                return null;
            }

            [EntityNameCamelCase].data[attributeName] = [EntityNameCamelCase]Data[attributeName];
        });

        const createResult = await [EntityNameCamelCase].save();

        if (!createResult) {
            this.populateError([EntityNameCamelCase].getLastError());
            return null;
        }

        return [EntityNameCamelCase].data;
    } 

    async update[EntityNamePascalCase]([EntityNameCamelCase]Id, [EntityNameCamelCase]Data, additionalParams) {
        const [EntityNameCamelCase] = new [EntityNamePascalCase](this.dxInstance);

        for (const attributeName of Object.keys([EntityNameCamelCase]Data)) {
            if (![EntityNamePascalCase].userEditableFields.includes(attributeName)) {
                this.populateError(`Invalid attribute provided: ${attributeName}`);
                return null;
            }

            [EntityNameCamelCase].data[attributeName] = [EntityNameCamelCase]Data[attributeName];
        }

        const updateResult = await [EntityNameCamelCase].updateById([EntityNameCamelCase]Id, [EntityNameCamelCase]Data);

        if (!updateResult) {
            this.populateError([EntityNameCamelCase].getLastError());
        }

        return updateResult;
    }

    async delete[EntityNamePascalCase]([EntityNameCamelCase]Id = null, additionalParams = {}) {
        const [EntityNameCamelCase] = new [EntityNamePascalCase](this.dxInstance);

        const deleteResult = await [EntityNameCamelCase].deleteById([EntityNameCamelCase]Id);

        if (!deleteResult) {
            this.populateError([EntityNameCamelCase].getLastError());
        }

        return deleteResult;
    }
}

module.exports = [EntityNamePascalCase]ControllerBase;