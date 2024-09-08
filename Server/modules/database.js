const pool = require("../config/db");

exports.CreateUser = function(data){
    return new Promise((resolve, reject) => {
        var str = "INSERT INTO users (id, fio, phone, email, refer, lessons, jwt) VALUES ('";
        str+=data["id"]+"', '"+data["fio"]+"', '"+data["phone"]+"', '"+data["email"]+"', '"+data["refer"]+"', '"+data["lessons"]+"', '"+data["jwt"]+"');";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve();
                }    
            }
        );
    });
}

exports.CreatePay = function(name, data){
    return new Promise((resolve, reject) => {
        var str = "INSERT INTO "+name+" (id, lessons) VALUES ('";
        str+=data["id"]+"', '"+data["lessons"]+"');";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve();
                }    
            }
        );
    });
}

exports.DeleteTableIFis = function(name){
    return new Promise((resolve, reject) => {
        const str = "SELECT EXISTS (SELECT * FROM pg_tables WHERE tablename = '"+name+"')";
        pool.query(str,
            async function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    if(results["rows"][0]["exists"]){
                        const str_del = "DROP TABLE "+name+";";
                        try {
                            const result = await pool.query(str_del);
                        }catch (err) {
                            reject(err.message);
                        }
                    }
                    resolve();
                }    
            }
        );
    });
}

exports.CreateUserTable = function(name){
    return new Promise((resolve, reject) => {
        var str = "CREATE TABLE "+name+"(Id CHARACTER VARYING(100) PRIMARY KEY,fio CHARACTER VARYING(200),phone CHARACTER VARYING(20) UNIQUE,";
        str+="email CHARACTER VARYING(250) UNIQUE,refer CHARACTER VARYING(100),lessons INTEGER,jwt CHARACTER VARYING(500) UNIQUE);";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve();
                }    
            }
        );
    });
}

exports.CreatePayTable = function(name){
    return new Promise((resolve, reject) => {
        var str = "CREATE TABLE "+name+"(Id CHARACTER VARYING(100), lessons INTEGER);";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve();
                }    
            }
        );
    });
}

exports.IsThereElementInTable = function(name, elem, data){
    return new Promise((resolve, reject) => {
        const str = "SELECT EXISTS (SELECT * FROM "+name+" WHERE "+elem+" = '"+data+"');";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve(results["rows"][0]["exists"]);
                }    
            }
        );
    });
}

exports.DeliteAllTableRows = function(name){
    return new Promise((resolve, reject) => {
        const str = "TRUNCATE TABLE "+name+";";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve();
                }    
            }
        );
    });
}

exports.FindDataUsers = function(name, elem, id){
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM "+name+" WHERE "+elem+"='"+id+"';",
            function(err, results, fields) {
                if(err)
                    reject(err);
                else
                    resolve(results["rows"]);
            }
        );
    })    
} 
exports.UpdateElemInDataBase = function(table,id,elem, data){
    return new Promise((resolve, reject) => {
        var str = "UPDATE "+table+" SET "+elem+"='"+data+"' WHERE id='"+id+"';";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve();
                }    
            }
        );
    });
}

exports.GetDataInBD = function(name){
    return new Promise((resolve, reject) => {
        var str = "SELECT * FROM "+name+" ORDER BY EMAIL;";
        pool.query(str,
            function(err, results, fields) {
                if (err){
                    reject(err);
                }
                else{
                    resolve(results["rows"]);
                }    
            }
        );
    });
}