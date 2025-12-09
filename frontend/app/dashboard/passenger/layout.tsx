'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function PassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#C0DFED] rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#08A6F6] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-[#484848] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null;
  }

  return (
    <DashboardLayout
      user={{
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      }}
      onLogout={logout}
    >
      {children}
    </DashboardLayout>
  );
}