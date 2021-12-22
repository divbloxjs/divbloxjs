const divbloxObjectBase = require('./object-base');

/**
 * DivbloxPackageControllerBase provides a blueprint for how api endpoints should be implemented
 * for divbloxjs projects
 */
class DivbloxPackageControllerBase extends divbloxObjectBase {

    /**
     * A basic constructor that can be overridden
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     * @param {string} packageName The name given to this package
     */
    constructor(dxInstance = null, packageName = 'base') {
        super();
        this.dxInstance = dxInstance;
        this.packageName = packageName;

        if ((typeof this.dxInstance === "undefined") || (this.dxInstance === null)) {
            throw new Error("Divblox instance was not provided");
        }

        this.packageOptions = this.dxInstance.getPackageOptions(this.packageName);
    }
}

module.exports = DivbloxPackageControllerBase;