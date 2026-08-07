require('dotenv').config();

/* 
set PATH=%PATH%;C:\Users\Gui\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64
set PATH=%PATH%;C:\Users\194412024\Downloads\node
set PATH=%PATH%;C:\Users\dleva\source\LOCAL\node
set PATH=%PATH%;C:\Users\195182024\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64
set PATH=%PATH%;C:\Users\194412024\node
set PATH=%PATH%;C:\Users\195182024\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64

set PATH=%PATH%;C:\Users\195172024\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64
npm start
*/

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
// const criancaRoutes = require("./routes/criancaRoutes");
//console.log(authRoutes);

const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(express.json());

app.use("/api", aiRoutes);

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

console.log()

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'view')));


app.use(authRoutes);

app.use(userRoutes);

/*app.use("/crianca", criancaRoutes);*/

const rateLimit = require("express-rate-limit");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta 3000");
});




// Diz ao Express onde estão seus arquivos front-end
app.use(express.static(path.join(__dirname, "view")));