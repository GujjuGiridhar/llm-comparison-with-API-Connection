
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
    // Sticky header with background blur, subtle border, and slight shadow for depth
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-6"> {/* Added padding */}
        {/* Logo/Title Section */}
        <div className="mr-6 flex items-center"> {/* Increased margin */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Scale className="h-6 w-6 text-primary group-hover:animate-pulse" /> {/* Added hover effect */}
            <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200 text-lg"> {/* Increased font size */}
              LLM Comparsion
            </span>
          </Link>
        </div>

        {/* Navigation Links - Right Aligned */}
        <div className="flex flex-1 items-center justify-end space-x-4 md:space-x-6"> {/* Adjusted spacing */}
           <Link
             href="/"
             className={cn(
               'relative flex items-center px-3 py-1.5 text-sm font-medium transition-colors duration-150 header-link', // Consistent padding, added relative and base link class
               isActive('/')
                 ? 'text-primary font-semibold header-link-active' // Active state: primary text, bold, apply active class for underline/glow
                 : 'text-muted-foreground hover:text-foreground' // Inactive state: muted color, hover to foreground
             )}
           >
             <Home className="mr-1.5 h-4 w-4" /> {/* Adjusted icon margin */}
             <span className="hidden sm:inline">Home</span>
           </Link>
           <Link
             href="/compare"
             className={cn(
                'relative flex items-center px-3 py-1.5 text-sm font-medium transition-colors duration-150 header-link',
                isActive('/compare')
                  ? 'text-primary font-semibold header-link-active' // Active state
                  : 'text-muted-foreground hover:text-foreground' // Inactive state
             )}
           >
             <GitCompareArrows className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
           </Link>
           <Link
             href="/settings"
             className={cn(
                'relative flex items-center px-3 py-1.5 text-sm font-medium transition-colors duration-150 header-link',
                isActive('/settings')
                  ? 'text-primary font-semibold header-link-active' // Active state
                  : 'text-muted-foreground hover:text-foreground' // Inactive state
             )}
           >
             <Settings className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
           </Link>
            <ThemeToggleButton /> {/* Add the theme toggle button */}
        </div>
      </div>
    </header>
  );
}

