function createOAuthPkceStorage(initialValues = {}) {
    const values = Object.create(null);

    Object.entries(initialValues).forEach(([key, value]) => {
        if (typeof key === "string" && typeof value === "string") {
            values[key] = value;
        }
    });

    const storage = {
        isServer: true,

        async getItem(key) {
            return values[key] ?? null;
        },

        async setItem(key, value) {
            values[key] = value;
        },

        async removeItem(key) {
            delete values[key];
        }
    };

    return {
        storage,
        snapshot() {
            return { ...values };
        }
    };
}

function serializeOAuthStorage(values) {
    return Buffer.from(
        JSON.stringify(values),
        "utf8"
    ).toString("base64url");
}

function deserializeOAuthStorage(value) {
    if (!value || typeof value !== "string" || value.length > 3500) {
        return {};
    }

    try {
        const decoded = Buffer.from(value, "base64url").toString("utf8");
        const parsed = JSON.parse(decoded);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }

        return parsed;
    } catch (error) {
        return {};
    }
}

module.exports = {
    createOAuthPkceStorage,
    serializeOAuthStorage,
    deserializeOAuthStorage
};
