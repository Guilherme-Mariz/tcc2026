const ChatSession = require("../model/chatSession");

class SessionManager {

    constructor() {
        this.sessions = new Map();
    }

    getSession(childId) {

        const key = String(childId);

        if (!this.sessions.has(key)) {
            this.sessions.set(key, new ChatSession(key));
        }

        return this.sessions.get(key);
    }

    hasSession(childId) {

        const key = String(childId);

        return this.sessions.has(key);
    }

    clearSession(childId) {

        const key = String(childId);

        this.sessions.delete(key);
    }

    clearAll() {

        this.sessions.clear();

    }

}

module.exports = new SessionManager();