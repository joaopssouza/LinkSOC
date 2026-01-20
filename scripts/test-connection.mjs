import fs from 'fs';
import path from 'path';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function testConnection() {
    console.log('🔄 Iniciando teste de conexão com Google Sheets...');

    // 1. Load env vars manually
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('❌ Arquivo .env.local não encontrado!');
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });

    const email = envVars['GOOGLE_SERVICE_ACCOUNT_EMAIL'];
    const privateKey = envVars['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n');
    const sheetId = envVars['GOOGLE_SHEET_ID'];

    if (!email || !privateKey || !sheetId) {
        console.error('❌ Variáveis de ambiente faltando. Verifique se EMAIL, PRIVATE_KEY e SHEET_ID estão no .env.local');
        console.log('Lidas:', {
            email: !!email,
            privateKey: !!privateKey,
            sheetId: !!sheetId
        });
        process.exit(1);
    }

    try {
        // 2. Auth
        const serviceAccountAuth = new JWT({
            email: email,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);

        // 3. Load Info
        await doc.loadInfo();

        console.log(`✅ CONEXÃO BEM SUCEDIDA!`);
        console.log(`📄 Título da Planilha: "${doc.title}"`);
        console.log(`📑 Abas encontradas:`);
        doc.sheetsByIndex.forEach(sheet => {
            console.log(`   - ${sheet.title} (Linhas: ${sheet.rowCount})`);
        });

    } catch (error) {
        console.error('❌ FALHA NA CONEXÃO:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Mensagem: ${error.response.statusText}`);
            if (error.response.data && error.response.data.error) {
                console.error(`Detalhe: ${error.response.data.error.message}`);
            }
        } else {
            console.error(error.message);
        }
        console.log('\n💡 DICA: Verifique se o email da Service Account está como EDITOR na planilha.');
        console.log(`Email Service Account: ${email}`);
    }
}

testConnection();
