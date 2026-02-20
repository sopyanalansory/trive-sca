import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Broker Forex Terbaik Indonesia Teregulasi Resmi BAPPEBTI, OJK, dan Bank Indonesia - Trive Invest",
  description: "Trive Invest, broker forex terbaik Indonesia teregulasi resmi BAPPEBTI, OJK, dan Bank Indonesia. Nikmati kondisi trading terbaik spread rendah, komisi $1, bebas biaya swap, leverage hingga 1:1000, dan edukasi untuk membantu Anda sukses di pasar forex.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
