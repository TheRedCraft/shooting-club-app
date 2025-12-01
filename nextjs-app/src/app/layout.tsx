import type { Metadata } from "next";
import { Providers } from "./providers";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Shooting Club Analytics",
  description: "Analytics platform for shooting clubs with Meyton integration",
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
