
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { Scale, Home, Settings, GitCompareArrows } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname(); // Get current pathname using the hook

  // Check if the link's path matches the current pathname
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Scale className="h-6 w-6" />
            <span className="font-bold sm:inline-block">
              LLM Comparo
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          {/* Links will be added here later if needed */}
        </nav>
        <div className="flex items-center justify-end space-x-4">
           <Link
             href="/"
             className={cn(
               'flex items-center transition-colors hover:text-foreground/80',
               isActive('/') ? 'text-foreground' : 'text-foreground/60'
             )}
           >
             <Home className="mr-1 h-4 w-4" />
             Home
           </Link>
           <Link
             href="/compare"
             className={cn(
               'flex items-center transition-colors hover:text-foreground/80',
               isActive('/compare') ? 'text-foreground' : 'text-foreground/60'
             )}
           >
             <GitCompareArrows className="mr-1 h-4 w-4" /> {/* Changed Icon */}
             Compare
           </Link>
           <Link
             href="/settings"
             className={cn(
               'flex items-center transition-colors hover:text-foreground/80',
               isActive('/settings') ? 'text-foreground' : 'text-foreground/60'
             )}
           >
             <Settings className="mr-1 h-4 w-4" />
             Settings
           </Link>
        </div>
      </div>
    </header>
  );
}
