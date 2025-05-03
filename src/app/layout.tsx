import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/header'; // Import the Header
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LLM Comparo', // Updated Title
  description: 'Compare LLM Performance. Make Informed Decisions.', // Updated Description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Remove hardcoded dark class, ThemeProvider will handle it
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
         <ThemeProvider
            attribute="class"
            defaultTheme="dark" // Keep dark as default
            enableSystem
            disableTransitionOnChange
          >
            <Header /> {/* Add the Header */}
            <div className="flex-grow">
              {children}
            </div>
            <Toaster />
         </ThemeProvider>
      </body>
    </html>
  );
}
