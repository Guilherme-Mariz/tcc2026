const VALID_EMOTIONS = [
    "positiva",
    "intermediaria",
    "negativa"
];

const VALID_ACTIVITIES = [
    "calma",
    "relaxamento",
    "expressão_emocional",
    "coragem",
    "amizade",
    "autoestima",
    "concentração",
    "gratidão",
    "empatia"
];

function parse(aiResponse) {

    if (!aiResponse || typeof aiResponse !== "object") {
        throw new Error("Resposta inválida da IA.");
    }

    const parsed = {

        response:
            typeof aiResponse.response === "string"
                ? aiResponse.response
                : "Vamos continuar conversando!",

        emotionGroup:
            VALID_EMOTIONS.includes(aiResponse.emotionGroup)
                ? aiResponse.emotionGroup
                : "intermediaria",

        confidence:
            typeof aiResponse.confidence === "number"
                && aiResponse.confidence >= 0
                && aiResponse.confidence <= 1
                    ? aiResponse.confidence
                    : 0.5,

        shouldSuggestActivity:
            Boolean(aiResponse.shouldSuggestActivity),

        activityCategory:
            null
    };

    if (
        parsed.shouldSuggestActivity &&
        VALID_ACTIVITIES.includes(aiResponse.activityCategory)
    ) {
        parsed.activityCategory = aiResponse.activityCategory;
    }

    return parsed;
}

module.exports = {
    parse
};