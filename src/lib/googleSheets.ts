import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Configurar as credenciais a partir das variáveis de ambiente
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Fix for newline characters in env vars
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

export async function loadSheet() {
    await doc.loadInfo();
    return doc;
}

export type Regra = {
    Status: string;
    Fluxo: string;
    Significado: string;
    Cor: string; // 'Verde' | 'Vermelho' | 'Amarelo'
};

export async function fetchRegrasFromSheet(): Promise<Regra[]> {
    await loadSheet();
    // Prioriza 'FLOW_STATUS', fallback para 'Regras' ou índice 0
    const sheet = doc.sheetsByTitle['FLOW_STATUS'] || doc.sheetsByTitle['Regras'] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map((row: any) => ({
        Status: row.get('Status') || '',
        Fluxo: row.get('Fluxo') || '',
        Significado: row.get('Significado') || '',
        Cor: row.get('Cor') || 'Cinza'
    }));
}

export async function getFifoByUniqueId(uniqueId: string) {
    // Mock return if no credentials
    if (!process.env.GOOGLE_SHEET_ID) {
        // Mock data for testing
        return {
            sequencial: 'CG9999',
            id: uniqueId
        };
    }

    await loadSheet();
    // Prioriza 'ID_GAIOLA', fallback para 'FIFO' ou índice 1
    const sheet = doc.sheetsByTitle['ID_GAIOLA'] || doc.sheetsByTitle['FIFO'] || doc.sheetsByIndex[1];
    const rows = await sheet.getRows();

    // Simple linear search (ideal: use a map or database logic)
    const row = rows.find((r: any) => r.get('ID_UNICO') === uniqueId);

    if (!row) return null;

    // Busca pela coluna SEQUENCIAL com várias possibilidades de nome
    // OU explicitamente pega a coluna A (índice 0)
    const headerColA = sheet.headerValues[0];
    const sequencialHeaders = [headerColA, 'SEQUENCIAL', 'Sequencial', 'sequencial', 'CODIGO', 'Codigo', 'codigo'];
    let sequencial = 'CG0000'; // Fallback

    for (const header of sequencialHeaders) {
        // @ts-ignore
        const val = row.get(header);
        if (val) {
            sequencial = val;
            break;
        }
    }

    return {
        sequencial: sequencial,
        id: uniqueId
    };
}
