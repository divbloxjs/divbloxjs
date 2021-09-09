/**
 * DivbloxGlobalBase is the lowest-level Divblox class that provides functionality that is reused in many Divblox
 * implementation classes.
 */
class DivbloxGlobalBase {
    /**
     * A default constructor that should be overridden by child classes
     */
    constructor() {
        this.errorInfo = [];
    }
    
    /**
     * Whenever Divblox encounters an error, the errorInfo array should be populated with details about the error. This
     * function simply returns that errorInfo array for debugging purposes
     * @returns {[]}
     */
    getError() {
        return this.errorInfo;
    }
    
    /**
     * Pushes a new error object/array into the error array
     * @param {{}|[]} errorToPush An object or array containing error information
     * @param {boolean} mustClean If true, the errorInfo array will first be emptied before adding the new error.
     */
    populateError(errorToPush = [], mustClean = false) {
        if (mustClean) {
            this.errorInfo = [];
        }
        this.errorInfo.push(errorToPush);
    }
}
module.exports = DivbloxGlobalBase;