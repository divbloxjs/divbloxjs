const divbloxObjectBase = require('./object-base');
const jwt = require('jsonwebtoken');
/**
 * DivbloxJwtWrapperBase provides a base class that implements the bare essentials for JWT integration with divbloxjs
 */
class DivbloxJwtWrapperBase extends divbloxObjectBase {
    /**
     * Simply instantiates the object and sets the given secret for future use
     */
    constructor(jwtSecret = 'secret') {
        super();
        this.jwtSecret = jwtSecret;
    }
    issueJwt(globalIdentifier) {
        //TODO: Create a new jwt for the given identifier. The payload must contain the identifier, and a list of all
        // it's globalIdentifierGroupings
    }
    verifyJwt(token) {
        //TODO: return true or false for the given token. True if verified, false if not. If false, then populate error.
    }
    getJwtPayload(token) {
        //TODO: First we verify, then we decode and return the payload
    }
    getJwtGlobalIdentifier(token) {
        //TODO: Returns the globalIdentifier stored in the payload using this.getJwtPayload()
    }
    getJwtGlobalIdentifierGroupings(token) {
        //TODO: Returns the globalIdentifierGroupings [] stored in the payload using this.getJwtPayload()
    }
}

module.exports = DivbloxJwtWrapperBase;