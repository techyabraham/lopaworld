import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lopaworld',
  description: 'Lopaworld — one house, seven labels.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
