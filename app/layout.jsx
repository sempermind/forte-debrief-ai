import './globals.css';

export const metadata = {
  title: 'Forté Debrief AI — Semper Mind',
  description: 'Your personalized Forté Communication Style debrief, powered by Semper Mind.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
