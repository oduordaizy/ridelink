'use client';

import Link from "next/link";
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
;
import { Menu, LogOut, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  FaHome,
  FaCarAlt,
  FaWallet,
  FaUser,
  FaUserCircle
} from "react-icons/fa";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { label: "Dashboard", href: "/dashboard/driver", icon: <FaHome className="mr-3 h-5 w-5" /> },
  { label: "My Rides", href: "/dashboard/driver/myrides", icon: <FaCarAlt className="mr-3 h-5 w-5" /> },
  { label: "Wallet", href: "/dashboard/driver/wallet", icon: <FaWallet className="mr-3 h-5 w-5" /> },
  { label: "Profile", href: "/dashboard/driver/profile", icon: <FaUser className="mr-3 h-5 w-5" /> },
];

export default function DriverSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const getInitials = (user: { first_name?: string; last_name?: string } | null) => {
    if (!user?.first_name) return 'U';
    return user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
      : user.first_name[0].toUpperCase();
  };

  return (
    <aside className="flex md:flex-col md:w-64 p-4 bg-white border-r h-screen shadow-md justify-between">
      <div className="w-full">
        {/* Mobile Trigger */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="text-xl">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SidebarContent pathname={pathname} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block w-full">
          <SidebarContent pathname={pathname} />
        </div>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 pt-4 mt-4 w-full">
        <div className="flex items-center px-4 py-3 hover:bg-gray-50 rounded-md transition-colors cursor-pointer">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage
              src="/default-profile.png"
              alt={user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
              className="object-cover"
            />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {user?.first_name ? (
                <span className="text-sm font-medium">
                  {getInitials(user)}
                </span>
              ) : (
                <FaUserCircle className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <Link
            href="/dashboard/driver/profile"
            className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Settings className="mr-3 h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full text-left group flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-700" />
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-1">
      <Link href='/' className='pacifico-regular flex items-center text-[#0086CA]'>
        <Image src="/logo.png" alt="Logo" width={40} height={40} className="!m-0" />
        <span className="ml-0 font-semibold text-xl">iTravas</span>
      </Link>

      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center px-4 py-3 rounded-md text-sm ${pathname === item.href
            ? "bg-blue-100 text-blue-800 font-medium"
            : "hover:[#005792] text-gray-700"
            }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
