import { notFound } from 'next/navigation';
import { getAppConfig } from '@/lib/googleSheets';
import NorseClient from './NorseClient';

export const dynamic = 'force-dynamic';

export default async function NorsePage() {
    const config = await getAppConfig();

    if (!config.modules.norse.enabled) {
        notFound();
    }

    return <NorseClient />;
}
