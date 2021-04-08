const mysql = require('mysql');
const util = require('util');

class DivbloxDatabaseConnector {
    constructor(database_config = {}) {
        this.database_config = database_config;
        this.init();
    }
    async init() {
        await this.checkDBConnection();
    }
    connectDB() {
        try {
            const connection = mysql.createConnection(this.database_config);
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
    async queryDB(query_str) {
        const database = this.connectDB();
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
    async queryDBMultiple(query_strings_arr = []) {
        const database = this.connectDB();
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
    async queryWithTransaction(db, callback) {
        try {
            await db.beginTransaction();
            await callback();
            await db.commit();
        } catch (err) {
            await db.rollback();
            throw err;
        } finally {
            await db.close();
        }
    }
    async checkDBConnection() {
        try {
            const database = this.connectDB();
            await database.close();
        } catch (error) {
            throw new Error("Error connecting to database: "+error);
        }
        return true;
    }
}

module.exports = DivbloxDatabaseConnector;


