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

//O QUE POSSO DIZER
router.get(
    "/atividades/oq-posso-dizer",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/oq-posso-dizer.html"
            )
        );
    }
);


//QUEBRA-CABEÇA DAS EMOÇÕES
router.get(
    "/atividades/quebra-cabeca-emocoes",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/quebra-cabeca-emocoes.html"
            )
        );
    }
);

//COMO ELE PODE ESTAR
router.get(
    "/atividades/como-ele-pode-estar",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/como-ele-pode-estar.html"
            )
        );
    }
);

//RESPIRE COM O TEKO
router.get(
    "/atividades/respire-com-teko",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/respire-com-teko.html"
            )
        );
    }
);

//MINHA VEZ, SUA VEZ
router.get(
    "/atividades/minha-vez-sua-vez",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/minha-vez-sua-vez.html"
            )
        );
    }
);

//O QUE FAZER AGORA
router.get(
    "/atividades/oq-fazer-agora",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/oq-fazer-agora.html"
            )
        );
    }
);

//O QUE PODE ME AJUDAR
router.get(
    "/atividades/oq-pode-me-ajudar",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/oq-pode-me-ajudar.html"
            )
        );
    }
);

//O QUE VEM DEPOIS
router.get(
    "/atividades/oq-vem-depois",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/oq-vem-depois.html"
            )
        );
    }
);

//MUDOU O PLANO
router.get(
    "/atividades/mudou-o-plano",
    verificarAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../view/pages/atividades/mudou-o-plano.html"
            )
        );
    }
);

module.exports = router;
