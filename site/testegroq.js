require("dotenv").config();

const childRepository = require("./services/childRepository");
const conversationService = require("./services/conversationService");
const sessionManager = require("./services/sessionManager");
const groqService = require("./services/groqService");

async function testEmotion() {

    try {

        const childId = "3c283e7a-f6dd-41ec-9a9d-5f784e788fb5";

        // Buscar criança
        const child = await childRepository.findById(childId);

        if (!child) {
            throw new Error("Criança não encontrada.");
        }

        // Buscar conversa
        const conversation =
            await conversationService.getConversation(
                child.id,
                child.firstName
            );

        // Criar sessão
        const session =
            sessionManager.getSession(child.id);

        // Mensagens para testar as três categorias
        const tests = [

            {
                category: "POSITIVA",
                message: "Estou muito feliz hoje! Ganhei um desenho que eu queria muito e estou adorando!"
            },

            {
                category: "INTERMEDIÁRIA",
                message: "Hoje foi um dia normal. Não aconteceu nada muito legal, mas também não aconteceu nada ruim."
            },

            {
                category: "NEGATIVA",
                message: "Hoje eu fiquei muito triste porque meus amigos não quiseram brincar comigo."
            }

        ];

        console.log("\n====================================");
        console.log("TESTE DE DETECÇÃO DE EMOÇÃO");
        console.log("====================================\n");

        for (const test of tests) {

            console.log("------------------------------------");
            console.log(`CATEGORIA ESPERADA: ${test.category}`);
            console.log("------------------------------------");

            console.log("\nCriança:");
            console.log(test.message);

            const result =
                await groqService.chat(
                    conversation,
                    session,
                    test.message
                );

            const detectedEmotion =
                result.conversation.getLastEmotion();

            const detectedTrend =
                result.conversation.getEmotionTrend();

            console.log("\nTEKO:");
            console.log(result.response);

            console.log("\nRESULTADO:");

            console.log(
                "Emoção detectada:",
                detectedEmotion
            );

            console.log(
                "Tendência detectada:",
                detectedTrend
            );

            console.log(
                "Esperado:",
                test.category.toLowerCase()
            );

            console.log(
                "✓ CORRETO:",
                detectedTrend === test.category.toLowerCase()
            );

            console.log("\n");

        }

        // Salvar memória
        await conversationService.saveConversation(
            conversation
        );

        console.log("====================================");
        console.log("TESTE FINALIZADO");
        console.log("====================================");

    } catch (error) {

        console.error("\nERRO:");
        console.error(error);

    }

}

testEmotion();