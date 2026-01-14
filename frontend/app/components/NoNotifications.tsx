'use client';

import { BellOff } from 'lucide-react';
import Link from 'next/link';

interface NoNotificationsProps {
  backHref: string;
}

export default function NoNotifications({ backHref }: NoNotificationsProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-[#C0DFED]/20 rounded-full flex items-center justify-center">
          <BellOff className="w-12 h-12 text-[#08A6F6]" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-[#00204a] mb-2">No Notifications</h2>
      <p className="text-[#828282] max-w-md mb-8">
        No notifications available right now. We'll let you know when something important happens!
      </p>
      
      <Link 
        href={backHref}
        className="px-8 py-3 bg-[#08A6F6] text-white font-semibold rounded-xl hover:bg-[#00204a] transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
