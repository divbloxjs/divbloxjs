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
     * @param {boolean} lastErrorOnly If set to true this will only return the latest error
     * @returns {[]}
     */
    getError(lastErrorOnly = false) {
        if (lastErrorOnly && this.errorInfo.length > 0) {
            return [this.errorInfo[this.errorInfo.length - 1]];
        }

        return this.errorInfo;
    }

    /**
     * Pushes a new error object/array/string into the error array
     * @param {{}|[]|string} errorToPush An object, array or string containing error information
     * @param {boolean} addAtStart If true, adds the error to the top of the errorInfo array
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

    /**
     * Resets the error info array
     */
    resetError() {
        this.errorInfo = [];
    }
}
module.exports = DivbloxGlobalBase;
