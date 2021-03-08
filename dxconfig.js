const config = {
    environment:process.env.NODE_ENV,
    environment_array:{
        "development":{
            db_config: {
                host: "localhost",
                user: "dbuser",
                password: "123",
                database: 'local_dx_db'
            }
            // Define any additional configuration options here
        },
        "production":{
            db_config: {
                host: "localhost",
                user: "dbuser",
                password: "123",
                database: 'local_dx_db'
            }
        }},
    getDatabaseConfiguration() {
        return this.environment_array[this.environment]["db_config"];
    }
};
module.exports = config;
