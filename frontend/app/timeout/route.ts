import { NextResponse } from 'next/server';

const SAFARICOM_IPS = [
    '196.201.214.',
    '196.201.213.',
    '196.201.212.',
    '196.196.164.'
];

function isSafaricomIp(ip: string | null): boolean {
    if (!ip) return false;
    // For local development or ignoring
    if (process.env.NODE_ENV === 'development' && (ip === '::1' || ip === '127.0.0.1')) return true;
    
    return SAFARICOM_IPS.some(prefix => ip.startsWith(prefix));
}

function isValidMpesaPayload(body: any): boolean {
    if (!body || typeof body !== 'object') return false;
    // Check for STK push or B2C result structures
    return (
        (body.Body && body.Body.stkCallback !== undefined) ||
        (body.Result && body.Result.ResultCode !== undefined) ||
        (body.stkCallback !== undefined)
    );
}

export async function POST(request: Request) {
    try {
        // 1. IP Validation
        // Depending on user Nginx setup, x-forwarded-for might contain a list of IPs.
        // We take the first one which is the original client.
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip');

        if (!isSafaricomIp(ip)) {
            console.warn(`Blocked unauthorized M-Pesa timeout callback from IP: ${ip}`);
            return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized IP" }, { status: 403 });
        }

        // 2. Secret Token Validation
        const { searchParams } = new URL(request.url);
        const requestSecret = searchParams.get('secret');
        const expectedSecret = process.env.MPESA_WEBHOOK_SECRET || 'default_secret_please_change_me';
        
        if (!requestSecret || requestSecret !== expectedSecret) {
            console.warn(`Blocked M-Pesa timeout callback with invalid secret from IP: ${ip}`);
            return NextResponse.json({ ResultCode: 1, ResultDesc: "Unauthorized Token" }, { status: 403 });
        }

        // 3. Payload validation
        const body = await request.json();
        
        if (!isValidMpesaPayload(body)) {
            console.warn(`Blocked malformed M-Pesa timeout payload`);
            return NextResponse.json({ ResultCode: 1, ResultDesc: "Malformed Payload" }, { status: 400 });
        }

        console.log('Received valid M-Pesa timeout callback:', JSON.stringify(body));

        // Forward the payload to the Django backend using the URL secret path structure
        const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://itravas.com';
        const callbackUrl = `${backendUrl}/api/payments/mpesa/callback/${expectedSecret}/`;
        
        // Fire and forget
        await fetch(callbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': ip || '127.0.0.1' // Pass the original Safaricom IP
            },
            body: JSON.stringify(body)
        }).catch(err => console.error('Error forwarding M-Pesa timeout to Django:', err));

        // Always return success to Daraja
        return NextResponse.json({
            ResultCode: 0,
            ResultDesc: "Accepted"
        });
    } catch (error) {
        console.error('Error processing M-Pesa timeout callback:', error);
        return NextResponse.json({
            ResultCode: 1,
            ResultDesc: "Internal Server Error"
        }, { status: 500 });
    }
}
