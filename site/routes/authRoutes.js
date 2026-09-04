const path = require("path");
const express = require("express");

const userController = require("../controller/userController");
const loginLimiter = require("../middleware/loginLimiter");
const verificarAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginLimiter, userController.login);
router.post("/register", userController.registerCompleto);

// O início e o callback usam PKCE. O code_verifier permanece somente em
// cookie HttpOnly durante os poucos minutos necessários para o redirecionamento.
router.get(
    "/auth/google",
    loginLimiter,
    userController.iniciarLoginGoogle
);

router.get(
    "/auth/google/callback",
    userController.finalizarLoginGoogle
);

router.get(
    "/auth/google/profile",
    verificarAuth,
    userController.obterPerfilGoogle
);

router.get(
    "/auth/profile",
    verificarAuth,
    userController.obterPerfilResponsavel
);

router.post(
    "/register/google",
    verificarAuth,
    userController.completarCadastroGoogle
);

router.post("/logout", userController.logout);

router.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "../view/pages/register.html"));
});

router.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../view/pages/login.html"));
});

module.exports = router;
