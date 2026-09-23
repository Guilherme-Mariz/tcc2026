const express = require("express");

const router = express.Router();

const childController =
    require("../controller/childController");

const verificarAuth =
    require("../middleware/authMiddleware.js");

const pinLimiter =
    require("../middleware/pinLimiter.js");

router.get(
    "/children",
    verificarAuth,
    (req, res) => childController.getChildren(req, res)
);

router.put(
    "/children/:childId/avatar",
    verificarAuth,
    (req, res, next) => express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "3mb" })(req, res, error => {
        if (error?.type === "entity.too.large") {
            return res.status(413).json({ success: false, error: "A imagem deve ter no máximo 3 MB." });
        }
        if (error) return next(error);
        return next();
    }),
    (req, res) => childController.updateAvatar(req, res)
);

router.post(
    "/verify-pin",
    verificarAuth,
    pinLimiter,
    (req, res) => childController.verifyPin(req, res)
);

module.exports = router;
