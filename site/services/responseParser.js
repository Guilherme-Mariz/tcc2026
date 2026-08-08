class ResponseParser {

    parse(aiResponse, conversation) {

        if (!aiResponse) {
            throw new Error("Resposta vazia da IA.");
        }

        if (
            !aiResponse.response ||
            typeof aiResponse.response !== "string"
        ) {
            throw new Error("Campo 'response' inválido.");
        }

        const current = conversation.toJSON();

        return {

            response: aiResponse.response,

            memory: {

                history:
                    typeof aiResponse.history === "string"
                        ? aiResponse.history
                        : current.history,

                summary:
                    typeof aiResponse.summary === "string"
                        ? aiResponse.summary
                        : current.summary,

                lastEmotion:
                    typeof aiResponse.emotionGroup === "string"
                        ? aiResponse.emotionGroup
                        : current.lastEmotion,

                emotionTrend:
                    this.validateEmotionTrend(
                        aiResponse.emotionTrend,
                        current.emotionTrend
                    ),

                lastActivity:
                    this.validateLastActivity(
                        aiResponse.activityCategory,
                        current.lastActivity
                    ),

                childInterests:
                    this.validateInterests(
                        aiResponse.childInterests,
                        current.childInterests
                    )

            }

        };

    }

    validateEmotionTrend(value, fallback) {

        const allowed = [
            "positiva",
            "intermediaria",
            "negativa"
        ];

        return allowed.includes(value)
            ? value
            : fallback || "intermediaria";

    }

    validateLastActivity(activityCategory, fallback) {

        if (
            typeof activityCategory === "string" &&
            activityCategory.trim() !== ""
        ) {

            return {
                category: activityCategory,
                accepted: null
            };

        }

        return fallback || {
            category: null,
            accepted: null
        };

    }

    validateInterests(interests, fallback) {

        if (!Array.isArray(interests)) {
            return fallback || [];
        }

        return interests
            .filter(item =>
                item &&
                typeof item.name === "string"
            )
            .map(item => ({

                name: item.name,

                confidence:
                    typeof item.confidence === "number"
                        ? item.confidence
                        : 1

            }));

    }

}

module.exports = new ResponseParser();