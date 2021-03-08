const mysql = require('mysql');
const util = require('util');
const config = require('../dxconfig');
const db_config = config.getDatabaseConfiguration();

function connectDB() {
    try {
        const connection = mysql.createConnection( db_config );
        return {
            query( sql, args ) {
                return util.promisify( connection.query )
                    .call( connection, sql, args );
            },
            beginTransaction() {
                return util.promisify( connection.beginTransaction )
                    .call( connection );
            },
            commit() {
                return util.promisify( connection.commit )
                    .call( connection );
            },
            rollback() {
                return util.promisify( connection.rollback )
                    .call( connection );
            },
            close() {
                return util.promisify( connection.end ).call( connection );
            }
        };
    } catch (error) {
        console.log(error);
        return null;
    }

}

async function queryDB(query_str) {
    const database = connectDB();
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
async function queryDBMultiple(query_strings_arr = []) {
    const database = connectDB();
    let query_result = {};
    try {
        await queryWithTransaction( database, async () => {
            let temp_data = [];
            for (const query_str of query_strings_arr) {
                temp_data.push(await database.query( query_str ));
            }
            query_result = temp_data;
        } );
    } catch ( err ) {
        // handle error
        query_result = {"error":err};
    }
    return query_result;
}
async function queryWithTransaction( db, callback ) {
    try {
        await db.beginTransaction();
        await callback();
        await db.commit();
    } catch ( err ) {
        await db.rollback();
        throw err;
    } finally {
        await db.close();
    }
}
async function checkDBConnection() {
    try {
        const database = connectDB();
        await database.close();
    } catch (error) {
        return false;
    }
    return true;
}

module.exports = {
    queryDB,
    queryDBMultiple,
    checkDBConnection
};


