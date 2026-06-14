import { notFound } from 'next/navigation';
import { getAppConfig } from '@/lib/googleSheets';
import FifoClient from './FifoClient';

export const dynamic = 'force-dynamic';

export default async function FifoPage() {
    const config = await getAppConfig();

    if (!config.modules.fifo.enabled) {
        notFound();
    }

    return <FifoClient />;
}
