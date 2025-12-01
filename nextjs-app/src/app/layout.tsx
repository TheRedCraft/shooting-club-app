import type { Metadata } from "next";
import { Providers } from "./providers";
import Navigation from "@/components/Navigation";
import { clubConfig } from "@/lib/config/club";

export const metadata: Metadata = {
  title: clubConfig.name,
  description: clubConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
