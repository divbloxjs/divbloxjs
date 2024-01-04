const DivbloxBase = require("divbloxjs/divblox");
const [EntityNamePascalCase]ControllerBase = require('divbloxjs/dx-code-gen/generated-base/controllers/[EntityNameLowerCaseSplitted].controller-base');

class [EntityNamePascalCase]Controller extends [EntityNamePascalCase]ControllerBase {
    /**
     * A basic constructor that can be overridden
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     * @param {string} packageName The name given to this package
     */
    constructor(dxInstance = null, packageName = '[PackageNameCamelCase]') {
        super(dxInstance, packageName);
        // TODO: Override as required
    }
    // TODO: Add entity specific functionality below
}

module.exports = [EntityNamePascalCase]Controller;