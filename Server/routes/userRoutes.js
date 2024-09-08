const express = require("express");
const userController = require("../controllers/userController");
const viewController = require("../controllers/viewController");
const userRouter = express.Router();

userRouter.get("/createReferLink/:token", userController.createReferLink);
userRouter.post("/addPay", userController.addPay);
userRouter.post("/createNewUser", userController.createNewUser);
userRouter.get("/referStatistics/:token", userController.referStatistics);
userRouter.get("/getDataInDB", userController.getDataInDB);

userRouter.get("/reg*", viewController.regUser);
userRouter.get("/test", viewController.test);

module.exports = userRouter;