const divbloxObjectBase = require('./object-base');

/**
 * DivbloxPackageControllerBase provides a blueprint for how api endpoints should be implemented
 * for divbloxjs projects
 */
class DivbloxPackageControllerBase extends divbloxObjectBase {

    /**
     * A basic constructor that can be overridden
     * @param {DivbloxBase} dxInstance An instance of divbloxjs to allow for access to the app configuration
     */
    constructor(dxInstance = null) {
        super();
        this.dxInstance = dxInstance;

        if ((typeof this.dxInstance === "undefined") || (this.dxInstance === null)) {
            throw new Error("Divblox instance was not provided");
        }
    }
}

module.exports = DivbloxPackageControllerBase;