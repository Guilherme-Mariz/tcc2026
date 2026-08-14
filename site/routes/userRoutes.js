const path = require("path")
const express = require("express");
const router = express.Router();

const verificarAuth = require("../middleware/authMiddleware");

// INDEX
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../view/index.html'));
});

// HOME
router.get('/home', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/home.html'));
});

// CONFIGURAÇÕES
router.get('/configuracoes', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/configuracoes.html'));
});

// TEKO.IA
router.get('/tekoia', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/tekoia.html'));
});

// RESPONSAVEL
router.get('/responsavel', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/responsavel.html'));
});

//PARTE DE ATIVIDADES

// ATIVIDADES
router.get('/atividades', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/atividades.html'));
});

//MODULO 2: MONTE A FRASE
router.get("/atividades/monte-frase", verificarAuth, (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "../view/pages/atividades/monte-frase.html"
        )
    );
});

module.exports = router;