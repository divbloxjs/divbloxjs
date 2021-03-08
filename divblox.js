const config = require('./dxconfig');
const db = require('./dx_core_modules/dx_db_connector');
console.log("Divblox loaded with config: "+config.environment);
const dx = {
    async initDx() {
        this.checkDBConnection();
        this.runDx();
    },
    async runDx() {

    },
    async checkDBConnection() {
        try {
            const db_available = await db.checkDBConnection();
            if (!db_available) {
                throw new Error("Divblox cannot establish a connection to the database");
            }
        } catch (error) {
            console.log(error);
            process.exit(1);
        }

    }
}
dx.initDx();