
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Import usePathname
import { Scale, Home, Settings, GitCompareArrows } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ThemeToggleButton } from "@/components/theme-toggle-button"; // Import the theme toggle button

export function Header() {
  const pathname = usePathname(); // Get current pathname using the hook

  // Check if the link's path matches the current pathname
  const isActive = (path: string) => pathname === path;

  return (
    // Sticky header with background blur and subtle border
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo/Title Section */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Scale className="h-6 w-6 text-primary" /> {/* Added color to icon */}
            <span className="font-bold sm:inline-block text-foreground">
              LLM Comparsion {/* Updated text */}
            </span>
          </Link>
        </div>

        {/* Navigation Links - Right Aligned */}
        <div className="flex flex-1 items-center justify-end space-x-4 md:space-x-6"> {/* Adjusted spacing */}
           <Link
             href="/"
             className={cn(
               'flex items-center px-2 py-1 text-sm font-medium transition-colors hover:text-primary', // Adjusted padding and added primary hover
               isActive('/')
                 ? 'text-primary border-b-2 border-primary' // Active state: primary color and bottom border
                 : 'text-muted-foreground' // Inactive state: muted color
             )}
           >
             <Home className="mr-1 h-4 w-4" />
             <span className="hidden sm:inline">Home</span>
           </Link>
           <Link
             href="/compare"
             className={cn(
                'flex items-center px-2 py-1 text-sm font-medium transition-colors hover:text-primary',
                isActive('/compare')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground'
             )}
           >
             <GitCompareArrows className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
           </Link>
           <Link
             href="/settings"
             className={cn(
                'flex items-center px-2 py-1 text-sm font-medium transition-colors hover:text-primary',
                isActive('/settings')
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground'
             )}
           >
             <Settings className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
           </Link>
            <ThemeToggleButton /> {/* Add the theme toggle button */}
        </div>
      </div>
    </header>
  );
}
