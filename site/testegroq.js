require("dotenv").config();

const { chat } = require("./services/groqService.js");

async function testar() {

    const resposta = await chat("Estou muito bravo, não consigo me acalmar..");

    console.log(resposta);

}

testar();