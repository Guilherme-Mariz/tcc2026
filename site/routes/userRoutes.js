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

// ATIVIDADES
router.get('/atividades', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/atividades.html'));
});

// TEKO.IA
router.get('/tekoia', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/tekoia.html'));
});

// PERFIL
router.get('/perfil', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/perfil.html'));
})

// RESPONSAVEL
router.get('/responsavel', verificarAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../view/pages/responsavel.html'));
});

module.exports = router;