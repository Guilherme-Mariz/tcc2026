const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    skipSuccessfulRequests: true,
    max: 5, // 5 tentativas
    message: { erro: "Muitas tentativas com senha. Aguarde até 15 minutos ou entre com o Google." }
});


module.exports= loginLimiter;