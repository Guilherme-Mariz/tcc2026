const AUTH_COOKIE = "token";
const OAUTH_PKCE_COOKIE = "teko_oauth_pkce";

function isProduction() {
    return process.env.NODE_ENV === "production";
}

function authCookieOptions(maxAge = 60 * 60 * 1000) {
    return {
        httpOnly: true,
        secure: isProduction(),
        sameSite: "lax",
        maxAge,
        path: "/"
    };
}

function oauthCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction(),
        sameSite: "lax",
        maxAge: 10 * 60 * 1000,
        path: "/auth/google/callback"
    };
}

function setAuthCookie(res, accessToken, expiresInSeconds) {
    const maxAge = Number.isFinite(expiresInSeconds)
        ? expiresInSeconds * 1000
        : 60 * 60 * 1000;

    res.cookie(
        AUTH_COOKIE,
        accessToken,
        authCookieOptions(maxAge)
    );
}

function clearAuthCookie(res) {
    const { maxAge, ...options } = authCookieOptions();
    res.clearCookie(AUTH_COOKIE, options);
}

function setOAuthPkceCookie(res, value) {
    if (!value || value.length > 3500) {
        throw new Error("Estado PKCE inválido.");
    }

    res.cookie(OAUTH_PKCE_COOKIE, value, oauthCookieOptions());
}

function clearOAuthPkceCookie(res) {
    const { maxAge, ...options } = oauthCookieOptions();
    res.clearCookie(OAUTH_PKCE_COOKIE, options);
}

module.exports = {
    AUTH_COOKIE,
    OAUTH_PKCE_COOKIE,
    setAuthCookie,
    clearAuthCookie,
    setOAuthPkceCookie,
    clearOAuthPkceCookie
};
