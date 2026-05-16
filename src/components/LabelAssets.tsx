import Image from 'next/image';

interface LabelWrapperProps {
    orientation?: 'landscape' | 'portrait';
    size?: '150x100' | '100x150' | '100x75' | '75x100';
    children: React.ReactNode;
    bgType?: 'default' | 'qrcode';
}

export const LabelWrapper = ({ orientation, size, children, bgType = 'default' }: LabelWrapperProps) => {
    // Determinar tamanho efetivo
    let effSize = size;
    if (!effSize) {
        effSize = orientation === 'portrait' ? '100x150' : '150x100';
    }

    const isLandscape = effSize === '150x100' || effSize === '100x75';

    let width = '567px';
    let height = '378px';
    let printSize = '150mm 100mm';

    if (effSize === '100x150') {
        width = '378px';
        height = '567px';
        printSize = '100mm 150mm';
    } else if (effSize === '75x100') {
        width = '283px';
        height = '378px';
        printSize = '75mm 100mm';
    } else if (effSize === '100x75') {
        width = '378px';
        height = '283px';
        printSize = '100mm 75mm';
    }

    // Selecionar background baseado no tipo
    let bgImage: string;
    if (isLandscape) {
        bgImage = '/assets/referencia/label-bg-landscape.png';
    } else {
        bgImage = bgType === 'qrcode'
            ? '/assets/referencia/label-bg-qrcode-portrait.png'
            : '/assets/referencia/label-bg-portrait.png';
    }

    return (
        <div
            className="relative overflow-hidden bg-white text-black shadow-2xl print:shadow-none print:m-0 box-border flex flex-col items-center justify-center p-8 pt-1"
            style={{
                width: width,
                height: height,
            }}
        >
            {/* Background Image Absolute */}
            <div className="absolute inset-0 z-0">
                <Image
                    src={bgImage}
                    alt="Label Background"
                    fill
                    className="object-fill"
                    priority
                />
            </div>

            {/* Content Container Relative z-10 */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                {children}
            </div>

            <style jsx global>{`
                @media print {
                  @page {
                    size: ${printSize};
                    margin: 0;
                  }
                  /* Force background printing */
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
            `}</style>
        </div>
    );
};
