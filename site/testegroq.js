require("dotenv").config();

const groqService = require("./services/ai/groqService");

async function testar() {

    console.log("--------------------");

    const r1 = await groqService.chat(

        "crianca01",

        "Oi!"

    );

    console.log(r1.response);

    console.log("--------------------");

    const r2 = await groqService.chat(

        "crianca01",

        "Hoje fiquei triste."

    );

    console.log(r2.response);

    console.log("--------------------");

    const r3 = await groqService.chat(

        "crianca01",

        "Foi porque briguei com meu amigo."

    );

    console.log(r3.response);

    const conversationService = require("./services/conversationService");

    console.log("\n===== HISTÓRICO =====\n");

    console.log(

    conversationService.getHistory("crianca01")

);
}

testar();