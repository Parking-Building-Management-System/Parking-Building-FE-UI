'use client';

import { useParams } from 'next/navigation';

import { CardActiveSessionGuide } from '@/features/pwa/card-active-session-guide';

export default function PwaCardActiveSessionPage() {
    const params = useParams<{ qrToken?: string | string[] }>();
    const qrTokenParam = params.qrToken;
    const qrToken = Array.isArray(qrTokenParam)
        ? qrTokenParam[0] || ''
        : qrTokenParam || '';

    return <CardActiveSessionGuide qrToken={qrToken} />;
}
