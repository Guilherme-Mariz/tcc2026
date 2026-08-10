require("dotenv").config();

const supabase = require("./config/supabase");
const childRepository = require("./services/childRepository");

async function testSecurity() {

    try {

        console.log("\n====================================");
        console.log("TESTE DE SEGURANÇA");
        console.log("====================================\n");

        // =====================================================
        // 1. BUSCAR DUAS CRIANÇAS DE RESPONSÁVEIS DIFERENTES
        // =====================================================

        const { data: children, error } = await supabase
            .from("criancas")
            .select("id, responsavel_id")
            .limit(20);

        if (error) {
            throw error;
        }

        if (!children || children.length < 2) {

            console.log(
                "É necessário ter pelo menos duas crianças cadastradas."
            );

            return;
        }

        // Procurar duas crianças com responsáveis diferentes
        let childA = null;
        let childB = null;

        for (let i = 0; i < children.length; i++) {

            for (let j = i + 1; j < children.length; j++) {

                if (
                    children[i].responsavel_id !==
                    children[j].responsavel_id
                ) {

                    childA = children[i];
                    childB = children[j];

                    break;
                }
            }

            if (childA && childB) {
                break;
            }
        }

        if (!childA || !childB) {

            console.log(
                "Não foram encontradas crianças vinculadas a responsáveis diferentes."
            );

            return;
        }

        console.log("Responsável A:", childA.responsavel_id);
        console.log("Criança A:", childA.id);

        console.log("\nResponsável B:", childB.responsavel_id);
        console.log("Criança B:", childB.id);


        // =====================================================
        // 2. SIMULAR RESPONSÁVEL A
        // =====================================================

        const authenticatedResponsibleId =
            childA.responsavel_id;

        console.log("\n====================================");
        console.log("SIMULANDO ACESSO DO RESPONSÁVEL A");
        console.log("====================================");


        // =====================================================
        // 3. TENTAR ACESSAR A PRÓPRIA CRIANÇA
        // =====================================================

        console.log("\n[TESTE 1]");
        console.log("Responsável A tentando acessar Criança A...");

        const ownChild =
            await childRepository.findById(childA.id,
                authenticatedResponsibleId
            );

        if (ownChild) {

            console.log(
                "✓ Acesso à própria criança permitido."
            );

        } else {

            console.log(
                "✗ Acesso à própria criança foi bloqueado."
            );

        }


        // =====================================================
        // 4. TENTAR ACESSAR A CRIANÇA DO RESPONSÁVEL B
        // =====================================================

        console.log("\n[TESTE 2]");
        console.log(
            "Responsável A tentando acessar Criança B..."
        );

        const unauthorizedChild =
            await childRepository.findById(childB.id);


        // =====================================================
        // 5. VERIFICAR RESULTADO
        // =====================================================

        if (unauthorizedChild) {

            console.log("\n❌ FALHA DE SEGURANÇA");

            console.log(
                "O sistema conseguiu encontrar uma criança"
            );

            console.log(
                "que pertence a outro responsável."
            );

            console.log(
                "\nO childRepository atualmente valida apenas:"
            );

            console.log("childId");

            console.log(
                "\nPrecisamos validar:"
            );

            console.log(
                "responsavel_id + childId"
            );

        } else {

            console.log(
                "\n✓ TESTE DE ISOLAMENTO PASSOU."
            );

            console.log(
                "O responsável não conseguiu acessar"
            );

            console.log(
                "uma criança de outro responsável."
            );

        }


        // =====================================================
        // 6. RESULTADO
        // =====================================================

        console.log("\n====================================");
        console.log("RESULTADO");
        console.log("====================================");

        console.log(
            "\nResponsável autenticado:",
            authenticatedResponsibleId
        );

        console.log(
            "Tentativa de acesso:",
            childB.id
        );

        console.log(
            "\n====================================");

    } catch (error) {

        console.error("\nERRO NO TESTE:");
        console.error(error);

    }

}

testSecurity();