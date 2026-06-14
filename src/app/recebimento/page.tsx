import { notFound } from 'next/navigation';
import { getAppConfig } from '@/lib/googleSheets';
import RecebimentoClient from './RecebimentoClient';

export const dynamic = 'force-dynamic';

export default async function RecebimentoPage() {
    const config = await getAppConfig();

    if (!config.modules.recebimento.enabled) {
        notFound();
    }

    return <RecebimentoClient />;
}
