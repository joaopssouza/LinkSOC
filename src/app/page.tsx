import Image from 'next/image';
import Link from 'next/link';
import { PackageOpen, QrCode, Search, AlertTriangle, Settings, Inbox } from 'lucide-react';
import { getAppConfig } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const config = await getAppConfig();
  const fifoDisabled = !config.modules.fifo.enabled;
  const norseDisabled = !config.modules.norse.enabled;
  const recebimentoDisabled = !config.modules.recebimento.enabled;
  const regrasDisabled = !config.modules.regras.enabled;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 font-sans">
      <header className="mb-12 flex items-center justify-between">
        <div className="text-center flex flex-col items-center justify-center flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Image src="/icon.png" alt="LinkSOC Logo" width={48} height={48} className="rounded-lg" />
            <div className="flex items-baseline gap-2">
              <h1 className="text-4xl font-bold text-shopee-primary">LinkSOC</h1>
              <span className="text-xs text-gray-400 dark:text-gray-400 font-medium italic">By: João Paulo S. S.</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Central de Tratativa Shopee Xpress</p>
        </div>
        <Link 
          href="/admin" 
          title="Painel de Controle"
          className="ml-4 p-3 rounded-lg bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-shopee-primary hover:text-white transition-all duration-200 hover:shadow-md"
        >
          <Settings className="w-6 h-6" />
        </Link>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModuleCard
          href="/norse"
          title="Identificação de Gaiolas"
          description="Geração rápida de etiquetas para EHA e RTS com seleção de turno."
          icon={<PackageOpen className="w-10 h-10 text-white" />}
          color="bg-shopee-primary"
          disabled={norseDisabled}
        />
        <ModuleCard
          href="/fifo"
          title="Etiquetas FIFO"
          description="Controle e rastreabilidade via QR Code com consulta ao Google Sheets."
          icon={<QrCode className="w-10 h-10 text-white" />}
          color="bg-shopee-blue"
          disabled={fifoDisabled}
        />
        <ModuleCard
          href="/regras"
          title="Status de Pacotes"
          description="Consulta rápida de status com feedback visual."
          icon={<Search className="w-10 h-10 text-white" />}
          color="bg-green-600"
          disabled={regrasDisabled}
        />
        <ModuleCard
          href="/avisos"
          title="Etiquetas de Aviso"
          description="Impressão de modelos estáticos (Vidro, Ração, Tinta, etc)."
          icon={<AlertTriangle className="w-10 h-10 text-white" />}
          color="bg-amber-500"
        />
        <ModuleCard
          href="/recebimento"
          title="Recebimento"
          description="Geração de etiquetas para recebimento (FM/LH)."
          icon={<Inbox className="w-10 h-10 text-white" />}
          color="bg-purple-600"
          disabled={recebimentoDisabled}
        />
      </div>
    </div>
  );
}

function ModuleCard({ href, title, description, icon, color, disabled = false }: { href: string, title: string, description: string, icon: React.ReactNode, color: string, disabled?: boolean }) {
  const cardContent = (
    <div className={`relative bg-white dark:bg-neutral-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-neutral-700 h-full transition-all duration-300 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-xl group-hover:scale-[1.01]'}`}>
      {disabled && (
        <div className="absolute top-3 right-3 z-10 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
          Desativado
        </div>
      )}
      <div className={`${color} p-6 flex justify-center items-center`}>
        {icon}
      </div>
      <div className="p-6">
        <h2 className={`text-xl font-bold mb-2 transition-colors ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100 group-hover:text-shopee-primary'}`}>{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div className="block" aria-disabled="true" title="Este módulo está desativado">
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={href} className="block group">
      {cardContent}
    </Link>
  );
}
