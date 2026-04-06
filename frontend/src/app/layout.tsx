import '@/styles/globals.css';
import { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Emergency Alert System',
  description: 'Community Emergency Alert Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
