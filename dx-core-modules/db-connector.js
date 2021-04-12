const mysql = require('mysql');
const util = require('util');

class DivbloxDatabaseConnector {
    constructor(database_config_array = {}) {
        this.database_config = {};
        this.error_info = [];
        this.module_array = Object.keys(database_config_array);
        console.dir(this.module_array);
        for (const module_name_str of this.module_array) {
            this.database_config[module_name_str] = database_config_array[module_name_str];
        }
        console.dir(this.database_config);
        this.init();
    }
    async init() {
        await this.checkDBConnection();
    }
    getError() {
        return this.error_info;
    }
    connectDB(module_name_str = null) {
        if (module_name_str === null) {
            this.error_info.push("Invalid module name NULL provided");
            return null;
        }
        try {
            const connection = mysql.createConnection(this.database_config[module_name_str]);
            return {
                query( sql, args ) {
                    return util.promisify(connection.query)
                        .call(connection, sql, args);
                },
                beginTransaction() {
                    return util.promisify(connection.beginTransaction)
                        .call(connection);
                },
                commit() {
                    return util.promisify(connection.commit)
                        .call(connection);
                },
                rollback() {
                    return util.promisify(connection.rollback)
                        .call(connection);
                },
                close() {
                    return util.promisify(connection.end).call(connection);
                }
            };
        } catch (error) {
            console.log(error);
            return null;
        }

    }
    async queryDB(query_str = null,module_name_str = null) {
        if (query_str === null) {
            this.error_info.push("Invalid query_str NULL provided");
        }
        const database = this.connectDB(module_name_str);
        if (database === null) {
            return null;
        }
        let query_result = {};
        try {
            query_result = await database.query(query_str);
        } catch ( err ) {
            // handle the error
            query_result = {"error":err};
        } finally {
            await database.close();
        }
        return query_result;
    }
    async queryDBMultiple(query_strings_arr = [], module_name_str = null) {
        const database = this.connectDB(module_name_str);
        if (database === null) {
            return null;
        }
        let query_result = {};
        try {
            await queryWithTransaction(database, async () => {
                let temp_data = [];
                for (const query_str of query_strings_arr) {
                    temp_data.push(await database.query(query_str));
                }
                query_result = temp_data;
            } );
        } catch ( err ) {
            // handle error
            query_result = {"error":err};
        }
        return query_result;
    }
    async queryWithTransaction(database, callback) {
        if (database === null) {
            return null;
        }
        try {
            await database.beginTransaction();
            await callback();
            await database.commit();
        } catch (err) {
            await database.rollback();
            throw err;
        } finally {
            await database.close();
        }
    }
    async checkDBConnection() {
        for (const module_name_str of this.module_array) {
            try {
                const database = this.connectDB(module_name_str);
                if (database === null) {
                    throw new Error("Error connecting to database: "+JSON.stringify(this.getError(),null,2));
                }
                await database.close();
            } catch (error) {
                throw new Error("Error connecting to database: "+error);
            }
        }
        return true;
    }
}

module.exports = DivbloxDatabaseConnector;


