'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/app/services/api';

export default function TestProfile() {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch(`${API_BASE_URL}/auth/profile/5/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const json = await res.json();
                setData(json);
            } catch (err: any) {
                setError(err.message);
            }
        };
        fetchProfile();
    }, []);

    return (
        <div className="p-10">
            <h1>Test Profile API (ID: 5)</h1>
            {error && <p className="text-red-500">Error: {error}</p>}
            <pre className="bg-gray-100 p-4 rounded mt-4">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}
