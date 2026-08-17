require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function teste() {

    try {

        const models = await groq.models.list();

        console.log("\n===== MODELOS DISPONÍVEIS =====\n");

        models.data.forEach(model => {
            console.log(model.id);
        });

        console.log("\n===============================\n");

    } catch (error) {

        console.error("\n===== ERRO =====");
        console.error(error);
        console.error("================\n");
    }
}

teste();