const { Pool } = require('pg');

const pool = new Pool({
    user: "myuser",
    host: "localhost",
    database: "refsystem",
    password: "12345",
    port: "5432",
});

module.exports = pool;