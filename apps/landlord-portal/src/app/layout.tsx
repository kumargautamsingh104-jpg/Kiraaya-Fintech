import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kiraaya — Your rent. Your credit.',
  description:
    'India\'s first rent-based credit infrastructure. Build your RentScore, get legally verified rental agreements, and unlock financial services through your consistent rent payments.',
  keywords: 'rent, credit score, India, rental agreement, UPI rent payment, RentScore',
  openGraph: {
    title: 'Kiraaya — Your rent. Your credit.',
    description: 'Convert your rent payment history into financial credit.',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
