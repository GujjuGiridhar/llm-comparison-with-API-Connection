
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
            <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
              LLM Comparsion
            </span>
          </Link>
        </div>

        {/* Navigation Links - Right Aligned */}
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4"> {/* Adjusted spacing */}
           <Link
             href="/"
             className={cn(
               'flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-accent hover:text-accent-foreground', // Consistent padding/rounding, added hover background
               isActive('/')
                 ? 'bg-accent text-accent-foreground font-semibold' // Active state: solid background, foreground text, bold
                 : 'text-muted-foreground' // Inactive state: muted color
             )}
           >
             <Home className="mr-1.5 h-4 w-4" /> {/* Adjusted icon margin */}
             <span className="hidden sm:inline">Home</span>
           </Link>
           <Link
             href="/compare"
             className={cn(
                'flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-accent hover:text-accent-foreground',
                isActive('/compare')
                  ? 'bg-accent text-accent-foreground font-semibold' // Active state: solid background
                  : 'text-muted-foreground'
             )}
           >
             <GitCompareArrows className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
           </Link>
           <Link
             href="/settings"
             className={cn(
                'flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-accent hover:text-accent-foreground',
                isActive('/settings')
                  ? 'bg-accent text-accent-foreground font-semibold' // Active state: solid background
                  : 'text-muted-foreground'
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

