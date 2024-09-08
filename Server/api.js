const express = require("express");
const userRouter = require("./routes/userRoutes.js");
const path = require('path');

const app = express();
const PORT = 1000;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.urlencoded({ extended: false }));

app.use(express.json());
app.use("/", userRouter);

app.options("*", (req, res)=>{
    res.append("Access-Control-Allow-Origin", "*");
    res.append("Access-Control-Allow-Methods", "*");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    res.send(null);
})

app.listen(PORT, () => {
    console.log('Server is start: http://localhost:1000');
})

module.exports = app;
