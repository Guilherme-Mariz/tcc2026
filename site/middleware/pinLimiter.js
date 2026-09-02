const rateLimit = require("express-rate-limit");

// Limita apenas tentativas inválidas de PIN para reduzir força bruta.
const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        valid: false,
        error: "Muitas tentativas. Aguarde alguns minutos."
    }
});

module.exports = pinLimiter;

