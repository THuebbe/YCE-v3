import type { Metadata } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import { BRAND } from '@/lib/brand';
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
      afterSignOutUrl="/auth/sign-in"
    >
      {children}
    </ClerkProvider>
  );
}

// Brand fonts (DESIGN.md). Their variables go on <html> so the
// --font-display / --font-body tokens on :root can resolve them.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  applicationName: BRAND.name,
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
      <html lang="en" className={`h-full ${fredoka.variable} ${nunitoSans.variable}`}>
        <body
          className="h-full bg-canvas font-body text-fg antialiased selection:bg-brand selection:text-on-brand"
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
