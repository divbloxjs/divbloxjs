const divbloxObjectBase = require('./object-base');

/**
 * DivbloxPackageControllerBase provides a blueprint for how api endpoints should be implemented
 * for divbloxjs projects
 */
class DivbloxPackageControllerBase extends divbloxObjectBase {
    /**
     * A basic constructor that can be overridden
     */
    constructor() {
        super();
    }
}

module.exports = DivbloxPackageControllerBase;