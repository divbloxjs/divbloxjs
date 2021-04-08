const readline = require("readline");

const dx_utils = {
    async getCommandLineInput(question = "") {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return await new Promise(resolve => {
            rl.question(question+" ", answer => resolve(answer))
        });
    },
    /**
     * Returns a date that can be used with MySQL
     * @param current_date
     * @param seconds_to_add
     * @return {string}
     */
    getDateStringFromCurrentDate(current_date = new Date(),seconds_to_add = 0) {
        let current_date_local = new Date(current_date);
        current_date_local.setSeconds(current_date_local.getSeconds() + seconds_to_add);
        const date_from_current_str = current_date_local.toISOString().replace('T', ' ');
        return date_from_current_str.substring(0,date_from_current_str.length - 5);
    },
    /**
    * Sleeps for ms seconds when called with the await keyword
    * @param ms
    * @returns {Promise<unknown>}
    */
    sleep(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
module.exports = dx_utils;