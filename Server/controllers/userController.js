const database = require("../modules/database");
const crypto = require("crypto");

const SecretKey = "test";

const header={
    "typ": "JWT",
    "alg": "HS256"
}

exports.createReferLink = async function(req, res){
    res.append("Access-Control-Allow-Origin", "*");
    try {
        if (VerifyJWT(req.query.token)){
            const parse = req.query.token.split(".");
            const body = JSON.parse(atob(parse[1]));
            if ("id" in body){
                var is = await database.IsThereElementInTable("users", "id", body["id"]);
                if (is){
                    const out = {
                        command: "createReferLink",
                        status: "OK", 
                        refer_link: "http://localhost:1000/reg?ref="+body["id"]
                    }
                    res.json(out);
                }else
                    throw("wrong id")
            }else
                throw("wrong body");
        }else
            throw("wrong JWT")
    }catch (er) {
        const out = {
            command: "createReferLink",
            status: "ERROR",
            reason: er
        }
        res.json(out);
    }
}

exports.addPay = function(req, res){
    res.append("Access-Control-Allow-Origin", "*");
    var body = req.body;
    try{
        if ("token" in body && "lessons" in body){
            if (VerifyJWT(body["token"])){
                const parse = body["token"].split(".");
                const token_body = JSON.parse(atob(parse[1]));
                if ("id" in token_body && "lessons" in body && Number(body["lessons"]) >= 8 && Number(body["lessons"]) <= 128){
                    var data_in_base = {};
                    database.FindDataUsers("users", "id", token_body["id"]).then(async function(data){
                        data_in_base["user"] = data[0];
                        var less_user = data_in_base["user"]["lessons"]+Number(body["lessons"]);
                        if (data_in_base["user"]["refer"] != ""){
                            database.FindDataUsers("users", "id", data_in_base["user"]["refer"]).then(async function(data){
                                data_in_base["refer"] = data[0];
                                if (data_in_base["user"]["lessons"] == 0){
                                    less_user += 4;
                                    const less_refer = data_in_base["refer"]["lessons"]+4;
                                    await database.UpdateElemInDataBase("users", data_in_base["refer"]["id"], "lessons", less_refer);
                                }
                                await database.UpdateElemInDataBase("users", data_in_base["user"]["id"], "lessons", less_user);
                            }).catch((err)=>{
                                throw(err);
                            });
                        }else{
                            await database.UpdateElemInDataBase("users", data_in_base["user"]["id"], "lessons", less_user);
                        }
                        const create = {id: data_in_base["user"]["id"], lessons: Number(body["lessons"])};
                        await database.CreatePay("pays", create);
                        const out = {
                            command: "addPay",
                            status: "OK"
                        }
                        res.json(out);
                    }).catch((err)=>{
                        throw(err);
                    });
                }else
                    throw("wrong body");
            }else
                throw("wrong JWT");
        }else
            throw("incomplete body");
    } catch (er) {
        const out = {
            command: "addPay",
            status: "ERROR",
            reason: er
        }
        res.json(out);
    }
}

exports.createNewUser = function(req,res){
    res.append("Access-Control-Allow-Origin", "*");
    var body = req.body;
    VerifyCreateUserData(body).then(async function(verify){
        if (verify["status"] == "OK"){
            const id = crypto.randomBytes(16).toString("hex");
            const payload = {"id": id};
            const JWT = GenJWT(header, payload);
            is = await database.IsThereElementInTable("users", "id", body["refer"]);
            if (!is)
                body["refer"] = "";
            body["id"] = id;
            body["jwt"] = JWT;
            body["lessons"] = 0;
            database.CreateUser(body).then(()=>{
                const out = {
                    "command": "createNewUser",
                    "status": "OK",
                    "token": JWT
                }
                res.json(out);
            }).catch((error)=>{
                console.log(error);
                const out = {
                    "command": "createNewUser",
                    "status": "ERROR",
                    "reason": error
                }
                res.json(out);
            });
        }else{
            verify["command"] = "createNewUser";
            res.json(verify);
        }
    });
};

exports.referStatistics = async function(req, res){
    res.append("Access-Control-Allow-Origin", "*");
    try {
        if (VerifyJWT(req.query.token)){
            const parse = req.query.token.split(".");
            const body = JSON.parse(atob(parse[1]));
            if ("id" in body){
                const is = await database.IsThereElementInTable("users", "id", body["id"]);
                if (is){
                    var out = {command: "referStatistics", status: "OK"};
                    database.FindDataUsers("users", "refer", body["id"]).then(async function(data){
                        var referals = {};
                        var all_less_ref = 0;
                        var payed_referals = 0;
                        for (key in data){
                            var result = {id: data[key]["id"], fio: data[key]["fio"], lessons: data[key]["lessons"], given_lessons: 0}
                            const is = await database.IsThereElementInTable("pays", "id", data[key]["id"]);
                            if (is){
                                result["given_lessons"] = 4;
                                all_less_ref+=4;
                                payed_referals++;
                            }
                            referals[key] = result;
                        }
                        out["lessons_from_referals"] = all_less_ref;
                        out["referals_amount"] = data.length;
                        if (data.length != 0)
                            out["referals_who_bought_lessons"] = Math.round((payed_referals/data.length)*100);
                        out["referals"] = referals;
                        res.json(out);
                    })
                }else
                    throw("wrong id")
            }else
                throw("wrong body");
        }else
            throw("wrong jwt");
    }catch (er) {
        const out = {
            command: "referStatistics",
            status: "ERROR",
            reason: er
        }
        res.json(out);
    }
}

exports.getDataInDB = function(req,res){
    res.append("Access-Control-Allow-Origin", "*");
    database.GetDataInBD("users").then((data)=>{
        const out = {command: "getDataInDB", status: "OK", result: data}
        res.json(out);
    }).catch((error)=>{
        const out = {command: "getDataInDB", status: "ERROR", reason: error}
        res.json(out);
    });
}


function GenJWT(header, payload){
    const hmac = crypto.createHmac("sha256", SecretKey);
    const signature = hmac.update(btoa(JSON.stringify(header)) + "." + btoa(JSON.stringify(payload))).digest("base64url");
    return (btoa(JSON.stringify(header))+ "." + btoa(JSON.stringify(payload))+ "." + signature) 
}

function VerifyJWT(JWT){
    const parse = JWT.split(".");
    if (parse.length == 3){
        const hmac = crypto.createHmac("sha256", SecretKey);
        const signature = hmac.update(parse[0] + "." + parse[1]).digest("base64url");
        if (signature == parse[2])
            return true;
    }
    return false;
}

async function VerifyCreateUserData(data){
    const out = {status: "OK"};
    if ("fio" in data && "phone" in data && "email" in data && "refer" in data){
        if (!(data["phone"].match(/^[0-9]+$/) != null) || data["email"].length < 7){
            out["phone"] = "incorrect";
            out["status"] = "ERROR";
            out["reason"] = "incorrect data";
        }
        if (data["email"].length <= 10 || !(!!~data["email"].indexOf("@"))){
            out["email"] = "incorrect";
            out["status"] = "ERROR";
            out["reason"] = "incorrect data";
        }
        const fio = data["fio"].split(" ");
        if (fio.length != 3){
            out["fio"] = "incorrect";
            out["status"] = "ERROR";
            out["reason"] = "incorrect data";
        }
        if (out["status"] == "OK"){
            var is = await database.IsThereElementInTable("users", "phone", data["phone"]);
            if (is){
                out["phone"] = "used";
                out["status"] = "ERROR";
                out["reason"] = "used data";
            }
            is = await database.IsThereElementInTable("users", "email", data["email"]);
            if (is){
                out["email"] = "used";
                out["status"] = "ERROR";
                out["reason"] = "used data";
            }
        }
    }else{
        out["status"] = "ERROR";
        out["reason"] = "incomplete body";
    }
    return out;
}