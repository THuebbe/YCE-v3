import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { clerkTheme } from '@/lib/clerk-theme';
import { ToastProvider } from '@/shared/components/feedback/toast';
import "./globals.css";

// Component to handle conditional Clerk provider
function ConditionalClerkProvider({ children }: { children: React.ReactNode }) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If no Clerk key, just return children without Clerk provider
  if (!clerkPublishableKey) {
    console.warn('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not found, Clerk disabled for build');
    return <>{children}</>;
  }
  
  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      appearance={clerkTheme}
    >
      {children}
    </ClerkProvider>
  );
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "YardCard Elite - Yard Sign Rental Management",
  description: "Professional yard sign rental platform for agencies. Manage inventory, orders, and customer bookings with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConditionalClerkProvider>
      <html lang="en" className="h-full">
        <body
          className={`${inter.variable} font-sans antialiased h-full bg-background-white text-neutral-900 selection:bg-secondary-pale selection:text-primary`}
        >
          <ToastProvider>
            <div className="min-h-full">
              {children}
            </div>
          </ToastProvider>
        </body>
      </html>
    </ConditionalClerkProvider>
  );
}
