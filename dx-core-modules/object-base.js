const dxUtils = require("dx-utilities");

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
     * Returns the latest error that was pushed, as an error object
     * @returns {DxBaseError|null} The latest error
     */
    getLastError() {
        let lastError = null;

        if (this.errorInfo.length > 0) {
            lastError = this.errorInfo[this.errorInfo.length - 1];
        }

        return lastError;
    }

    printLastError() {
        console.dir(this.getLastError(), { depth: null });
    }

    /**
     * @typedef dxErrorStack
     * @property {string} callerClass Name of the class populating the error
     * @property {string} message Error message given
     * @property {dxErrorStack|DxBaseError|string|null} errorStack Nested dxErrorStack,
     * or if is the base error populated, then can be a:
     * - DxBaseError,
     * - message,
     * - null (if not provided)
     */

    /**
     * Pushes a new error object/string into the error array
     * @param {dxErrorStack|string} errorToPush An object, array or string containing error information
     * @param {dxErrorStack|DxBaseError|null} errorStack An object, containing error information
     */
    populateError(errorToPush = "", errorStack = null) {
        let message = "No message provided";
        if (!errorToPush) {
            errorToPush = message;
        }

        if (!errorStack) {
            errorStack = errorToPush;
        }

        if (typeof errorToPush === "string") {
            message = errorToPush;
        } else if (
            dxUtils.isValidObject(errorToPush) ||
            errorToPush instanceof DxBaseError ||
            errorToPush instanceof Error
        ) {
            message = errorToPush.message ? errorToPush.message : "No message provided";
        } else {
            this.populateError(
                "Invalid error type provided, errors can be only of type string/Object/Error/DxBaseError"
            );
            return;
        }

        // Only the latest error to be of type DxBaseError
        let newErrorStack = {
            callerClass: errorStack.callerClass ? errorStack.callerClass : this.constructor.name,
            message: message ? message : errorStack.message ? errorStack.message : "No message provided",
            errorStack: errorStack.errorStack
                ? errorStack.errorStack
                : typeof errorStack === "string"
                ? null
                : errorStack,
        };

        const error = new DxBaseError(message, this.constructor.name, newErrorStack);

        // Make sure to keep the deepest stackTrace
        if (errorStack instanceof DxBaseError || errorStack instanceof Error) {
            error.stack = errorStack.stack;
        }

        this.errorInfo.push(error);
        return;
    }

    /**
     * Resets the error info array
     */
    resetError() {
        this.errorInfo = [];
    }
}

class DxBaseError extends Error {
    constructor(message = "", callerClass = "", errorStack = null, ...params) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(...params);

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DxBaseError);
        }

        this.name = "DxBaseError";

        // Custom debugging information
        this.message = message;
        this.callerClass = callerClass;
        this.dateTimeOccurred = new Date();
        this.errorStack = errorStack;
    }
}

module.exports = DivbloxGlobalBase;
