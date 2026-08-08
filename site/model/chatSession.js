class ChatSession {

    constructor(childId) {

        this.childId = childId;

        this.messages = [];

        this.MAX_MESSAGES = 10;

    }

    addUserMessage(content) {

        this.messages.push({
            role: "user",
            content
        });

        this.trim();

    }

    addAssistantMessage(content) {

        this.messages.push({
            role: "assistant",
            content
        });

        this.trim();

    }

    trim() {

        while (this.messages.length > this.MAX_MESSAGES) {
            this.messages.shift();
        }

    }

    getMessages() {

        return this.messages;

    }

    clear() {

        this.messages = [];

    }

}

module.exports = ChatSession;