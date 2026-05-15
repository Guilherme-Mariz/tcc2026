require('dotenv').config();

/* 
set PATH=%PATH%;C:\Users\Gui\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64
set PATH=%PATH%;C:\Users\194412024\node
set PATH=%PATH%;C:\Users\dleva\source\LOCAL\node
set PATH=%PATH%;C:\Users\195182024\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64

set PATH=%PATH%;C:\Users\195182024\Documents\PROJETOTCC\node\nodejs\node-v24.14.0-win-x64
npm start
*/

const rateLimit = require("express-rate-limit");


const verificarAuth = require("./middleware/authMiddleware");

// Importa o express
const express = require("express");

// Permite comunicação entre front e back
const cors = require("cors");

const path = require("path");

// COOKIE PARSER
const cookieParser = require("cookie-parser");

// Importa o controller
const userController = require("./controller/userController");

// Cria o servidor
const app = express();

// Permite ler JSON no body
app.use(express.json());

// Permite requisições externas (front-end)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, 'view')));

// COOKIE PARSER
app.use(cookieParser());

// LIMITE DE TENTATIVAS
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 5, // 5 tentativas
    message: { erro: "Muitas tentativas. Tente novamente mais tarde." }
});

// ROTAS PROFISSIONAIS

// INDEX
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view/index.html'));
});

// LOGIN
app.get('/login',  (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/login.html'));
});

// REGISTER
app.get('/register',  (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/register.html'));
});

// HOME
app.get('/home', verificarAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/home.html'));
});

// CONFIGURAÇÕES
app.get('/configuracoes', verificarAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/configuracoes.html'));
});

// ATIVIDADES
app.get('/atividades', verificarAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/atividades.html'));
});

// TEKO.IA
app.get('/tekoia', verificarAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/tekoia.html'));
});

// RESPONSAVEL
app.get('/responsavel', verificarAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'view/pages/responsavel.html'));
});


// ROTA DE CADASTRO
app.post("/register", userController.registerCompleto);
// Quando alguém fizer POST em /register → chama a função register

app.post('/login', loginLimiter, userController.login);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta 3000");
});


// Diz ao Express onde estão seus arquivos front-end
app.use(express.static(path.join(__dirname, "view")));