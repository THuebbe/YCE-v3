'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Users, CreditCard, Bell, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const settingsNavigation = [
  {
    name: 'Team',
    href: '/dashboard/settings/team',
    icon: Users,
    description: 'Manage team members and permissions',
  },
  {
    name: 'Payments',
    href: '/dashboard/settings/payments',
    icon: CreditCard,
    description: 'Connect Stripe and manage payment settings',
  },
  {
    name: 'Agency Profile',
    href: '/dashboard/settings/agency',
    icon: Building2,
    description: 'Update agency information and branding',
  },
  {
    name: 'Notifications',
    href: '/dashboard/settings/notifications',
    icon: Bell,
    description: 'Configure email and push notifications',
  },
  {
    name: 'Security',
    href: '/dashboard/settings/security',
    icon: Shield,
    description: 'Manage security settings and access controls',
  },
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your agency settings and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={item.href}>
                      Configure {item.name}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}