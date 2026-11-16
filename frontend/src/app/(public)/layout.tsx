import React from 'react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#090909] text-white">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <MobileBottomNav />
    </div>
  );
}

