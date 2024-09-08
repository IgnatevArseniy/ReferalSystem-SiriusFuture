const database = require("../Server/modules/database");

main();

async function main() {
    await database.DeleteTableIFis("users");
    await database.DeleteTableIFis("pays");
    
    await database.CreateUserTable("users");
    await database.CreatePayTable("pays");
    console.log("OK")
}
