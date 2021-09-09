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
     * Pushes a new error object/array/string into the error array
     * @param {{}|[]|string} errorToPush An object, array or string containing error information
     * @param {boolean} mustClean If true, the errorInfo array will first be emptied before adding the new error.
     */
    populateError(errorToPush = [], addAtStart = false, mustClean = false) {
        if (mustClean) {
            this.errorInfo = [];
        }
        if (!addAtStart) {
            this.errorInfo.push(errorToPush);
        } else {
            this.errorInfo.unshift(errorToPush);
        }
    }
}
module.exports = DivbloxGlobalBase;