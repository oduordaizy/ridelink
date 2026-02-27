'use server';

import { cookies } from 'next/headers';

export async function stkPushQuery(checkoutRequestId: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        // Fallback URL if env is not perfect
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://itravas.com';
        const apiUrl = `${baseUrl}/api/payments/mpesa/query/?checkout_request_id=${checkoutRequestId}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            cache: 'no-store', // Always fresh status
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: { response: { data } } };
        }

        return { data, error: null };
    } catch (error: any) {
        console.error('STK Query Server Action Error:', error);
        return { data: null, error: { response: { data: { errorMessage: 'Network error or session expired', errorCode: '500' } } } };
    }
}
