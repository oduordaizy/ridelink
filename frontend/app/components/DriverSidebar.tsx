'use client';

import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard/driver" },
  { label: "My Rides", href: "/dashboard/driver/myrides" },
  { label: "Wallet", href: "/dashboard/driver/wallet" },
  { label: "Profile", href: "/dashboard/driver/profile" },
];

export default function DriverSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex md:flex-col md:w-64 p-4 bg-white border-r h-screen shadow-md">
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
    </aside>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="space-y-2">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Travas</h2>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`block px-4 py-2 rounded-md ${
            pathname === item.href
              ? "bg-blue-100 text-blue-800 font-medium"
              : "hover:bg-blue-50 text-gray-700"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <Separator className="my-4" />
      <Link
        href="/"
        className="block px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
      >
        Back to Home
      </Link>
    </nav>
  );
}
