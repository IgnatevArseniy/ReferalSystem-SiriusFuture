const api = require("../Server/api");
const crypto = require("crypto");

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = require("chai");
const should = chai.should();

const dat = require("../Server/modules/database");

const correct_reg = require("./test_json/correct_reg.json");
const uncorrect_reg = require("./test_json/uncorrect_reg.json");


chai.use(chaiHttp);


const SecretKey = "test";
var referal_jwt = 0;
var main_jwt = 0;


const header={
  "typ": "JWT",
  "alg": "HS256"
}

describe("/createReferLink - проверка генерации реферальной ссылки", ()=>{
  it("Очистим базу данных", function(done){
    dat.DeliteAllTableRows("users").then(()=>{
      done();
    });
  });
  it("Создадим main аккаунт", (done)=>{
    main_jwt = GenJWT(header, {id: "main"});
    const create_main = {id: "main", fio: "main main main", phone: "555555555555", email: "gggggggggggg@mail.ru",
    refer: "", lessons: 0, jwt: main_jwt}
    dat.CreateUser(create_main).then(()=>{
      done();
    })
  });
  it('проверка с правильным jwt', (done) =>{
      chai.request(api)
        .get('/createReferLink/'+main_jwt)
        .end((err, res)=>{
          res.should.have.status(200);
          res.body.should.have.status("OK");
          done();
        })
  });
  it('проверка с не существующим id', (done) =>{
    const JWT = "no correct";
    chai.request(api)
      .get('/createReferLink/'+JWT)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("ERROR");
        done();
      })
  });
  it('проверка с не правильным jwt', (done) =>{
    const JWT = GenJWT(header, {id: "nooo"});;
    chai.request(api)
      .get('/createReferLink/'+JWT)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("ERROR");
        done();
      })
  });
});

describe("/createNewUser - проверка правильности сохранения данных пользователя в БД", ()=>{

  it("Очистим базу данных", function(done){
    dat.DeliteAllTableRows("users").then(()=>{
      done();
    });
  });

  it("Json с правильными данными", function(done){
    chai.request(api)
      .post("/createNewUser")
      .send(correct_reg)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("OK");
        done();
      });
  });
  it("Json с правильными повторяющимися даннымию. Возвращает error", function(done){
    chai.request(api)
      .post("/createNewUser")
      .send(correct_reg)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("ERROR");
        expect(res.body["reason"]).to.equal("used data");
        done();
      });
  });
  it("Json с не правильными email и phone number. Возвращает error", function(done){
    chai.request(api)
      .post("/createNewUser")
      .send(uncorrect_reg)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("ERROR");
        expect(res.body["reason"]).to.equal("incorrect data");
        done();
      });
  });
});

describe("/addPay - проверка сохранения платежей и уроков", ()=>{
  it("Очистим базу данных", function(done){
    dat.DeliteAllTableRows("users").then(()=>{
      dat.DeliteAllTableRows("pays").then(()=>{
        done();
      });
    });
  });
  it("Создадим 2-ух пользователей: 1-главный и 2-его реферал. У всех по 0 уроков", (done)=>{
    main_jwt = GenJWT(header, {id: "main"});
    const create_main = {id: "main", fio: "main main main", phone: "555555555555", email: "gggggggggggg@mail.ru",
    refer: "", lessons: 0, jwt: main_jwt}
    dat.CreateUser(create_main).then(()=>{
      referal_jwt = GenJWT(header, {id: "referal"});
      var create_referal = correct_reg;
      create_referal["id"] = "referal";
      create_referal["lessons"] = 0;
      create_referal["jwt"] = referal_jwt;
      dat.CreateUser(create_referal).then(()=>{
        done();
      });
    })
  });
  it("Воспроизведем ситуацию, когда реферал покупает первый абонемент на 8 уроков", (done)=>{
    chai.request(api)
      .post("/addPay")
      .send({"token": referal_jwt, "lessons":8})
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("OK");
        done();
      });
  });
  it("Теперь у реферала должно быть 12 уроков, а у главного - 4", (done)=>{
    var data_in_base = {};
    dat.FindDataUsers("users", "id", "main").then((data)=>{
      data_in_base["main"] = data[0];
      dat.FindDataUsers("users", "id", "referal").then((data)=>{
        data_in_base["referal"] = data[0];
        expect(data_in_base["referal"]["lessons"]).to.equal(12);
        expect(data_in_base["main"]["lessons"]).to.equal(4);
        done();
      });
    });
  })
  it("Проверка с неправильным JWT", (done)=>{
    chai.request(api)
      .post("/addPay")
      .send({"token": "fgd.hfgh.fgh", "lessons":8})
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("ERROR");
        done();
      });
  });
});


describe("/referStatistics - проверка получения правильной статистики", ()=>{
  it("Очистим базу данных", function(done){
    dat.DeliteAllTableRows("users").then(()=>{
      dat.DeliteAllTableRows("pays").then(()=>{
        done();
      });
    });
  });
  it("Создадим main аккаунт", (done)=>{
    main_jwt = GenJWT(header, {id: "main"});
    const create_main = {id: "main", fio: "main main main", phone: "555555555555", email: "gggggggggggg@mail.ru",
    refer: "", lessons: 0, jwt: main_jwt}
    dat.CreateUser(create_main).then(()=>{
      done();
    })
  });
  it("Проверим реферальную статитстику главного аккаунта. Должно быть все по нулям", (done)=>{
    chai.request(api)
      .get("/referStatistics/"+main_jwt)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("OK");
        expect(res.body["referals_amount"]).to.equal(0);
        done();
      });
  });
  it("Создадим 2-ух рефералов главного аккаунта", (done)=>{
    referal_jwt = GenJWT(header, {id: "referal1"});
    var ref1 = correct_reg;
    ref1["id"] = "referal1";
    ref1["lessons"] = 0;
    ref1["jwt"] = referal_jwt;
    dat.CreateUser(ref1).then(()=>{
      const ref2 = {id: "referal2", fio:"ref2 ref ref2", phone:"4645654645654",
      email:"fdgfdgfd@mail.ru", refer: "main", lessons: 0, jwt:GenJWT(header, {id: "referal2"})}
      dat.CreateUser(ref2).then(()=>{
        done();
      });
    });
  });
  it("Проверим реферальную статитстику главного аккаунта. Должно быть два реферала", (done)=>{
    chai.request(api)
      .get("/referStatistics/"+main_jwt)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("OK");
        expect(res.body["referals_amount"]).to.equal(2);
        done();
      });
  });
  it("Воспроизведем ситуацию, когда реферал 1 покупает первый абонемент на 8 уроков", (done)=>{
    chai.request(api)
      .post("/addPay")
      .send({"token": referal_jwt, "lessons":8})
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("OK");
        done();
      });
  });
  var str = "Проверим реферальную статитстику главного аккаунта. Должно быть два реферала,\n";
  str+="принесенное кол-во уроков: 4, процентное количество рефералов, купивших абонемент: 50%";
  it(str, (done)=>{
    chai.request(api)
      .get("/referStatistics/"+main_jwt)
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("OK");
        expect(res.body["referals_amount"]).to.equal(2);
        expect(res.body["lessons_from_referals"]).to.equal(4);
        expect(res.body["referals_who_bought_lessons"]).to.equal(50);
        done();
      });
  });
  it('проверка с не правильным jwt', (done) =>{
    chai.request(api)
      .get("/referStatistics/"+"fdhgfghfhgf.hfghd.hfghfd")
      .end((err, res)=>{
        res.should.have.status(200);
        res.body.should.have.status("ERROR");
        done();
      })
  });
});

describe("Очистка", ()=>{
  it("Очистим базу данных", function(done){
    dat.DeliteAllTableRows("users").then(()=>{
      dat.DeliteAllTableRows("pays").then(()=>{
        done();
      });
    });
  });
});



function GenJWT(header, payload){
  const hmac = crypto.createHmac("sha256", SecretKey);
  const signature = hmac.update(btoa(JSON.stringify(header)) + "." + btoa(JSON.stringify(payload))).digest("base64url");
  return (btoa(JSON.stringify(header))+ "." + btoa(JSON.stringify(payload))+ "." + signature) 
}

