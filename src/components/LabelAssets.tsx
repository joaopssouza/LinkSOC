import Image from 'next/image';

interface LabelWrapperProps {
    orientation: 'landscape' | 'portrait';
    children: React.ReactNode;
    bgType?: 'default' | 'qrcode';
}

export const LabelWrapper = ({ orientation, children, bgType = 'default' }: LabelWrapperProps) => {
    const isLandscape = orientation === 'landscape';

    // Landscape: 150mm x 100mm -> approx 567px x 378px
    // Portrait: 100mm x 150mm -> approx 378px x 567px
    const width = isLandscape ? '567px' : '378px';
    const height = isLandscape ? '378px' : '567px';

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
            className="relative overflow-hidden bg-white text-black shadow-2xl print:shadow-none print:m-0 box-border flex flex-col items-center justify-center p-8"
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
                    className="object-cover"
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
                    size: ${isLandscape ? '150mm 100mm' : '100mm 150mm'};
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
