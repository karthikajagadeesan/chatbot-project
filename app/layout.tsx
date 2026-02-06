import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chatbot - AI Chatbot SaaS Platform',
  description: 'Reusable AI Chatbot for Websites using Next.js, AI SDK & Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
