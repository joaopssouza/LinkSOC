import Image from 'next/image';
import Link from 'next/link';
import { PackageOpen, QrCode, Search, AlertTriangle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-8 font-sans">
      <header className="mb-12 text-center flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 mb-2">
          <Image src="/icon.png" alt="LinkSOC Logo" width={48} height={48} className="rounded-lg" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-4xl font-bold text-shopee-primary">LinkSOC</h1>
            <span className="text-xs text-gray-400 dark:text-gray-400 font-medium italic">By: João Paulo S. S.</span>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Central de Tratativa Shopee Xpress</p>
      </header>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <ModuleCard
          href="/norse"
          title="Identificação de Gaiolas"
          description="Geração rápida de etiquetas para EHA e RTS com seleção de turno."
          icon={<PackageOpen className="w-10 h-10 text-white" />}
          color="bg-shopee-primary"
        />
        <ModuleCard
          href="/fifo"
          title="Etiquetas FIFO"
          description="Controle e rastreabilidade via QR Code com consulta ao Google Sheets."
          icon={<QrCode className="w-10 h-10 text-white" />}
          color="bg-shopee-blue"
        />
        <ModuleCard
          href="/regras"
          title="Regras de Fluxo"
          description="Consulta rápida de status com feedback visual."
          icon={<Search className="w-10 h-10 text-white" />}
          color="bg-green-600"
        />
        <ModuleCard
          href="/avisos"
          title="Etiquetas de Aviso"
          description="Impressão de modelos estáticos (Vidro, Ração, Tinta, etc)."
          icon={<AlertTriangle className="w-10 h-10 text-white" />}
          color="bg-amber-500"
        />
      </div>
    </div>
  );
}

function ModuleCard({ href, title, description, icon, color }: { href: string, title: string, description: string, icon: React.ReactNode, color: string }) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-neutral-700 h-full">
        <div className={`${color} p-6 flex justify-center items-center`}>
          {icon}
        </div>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-shopee-primary transition-colors">{title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
}
