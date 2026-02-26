import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import GlobalProvider from "@/components/global-provider";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/ui/theme-provider";
import DomainFinder from "@/helpers/domain-finder";
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});



export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const subdomain = DomainFinder(headersList.get("host") || "user")

  return (
    <html lang="en">
      <body
        className={`${figtree.className} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalProvider subdomain={subdomain}>{children}</GlobalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
