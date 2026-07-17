import "./globals.css";
import { Poppins, Atkinson_Hyperlegible } from "next/font/google";
import { auth } from "../auth";
import { Nav } from "../components/ui/Nav";

// Poppins for display/headings; Atkinson Hyperlegible for body (an accessibility win).
// Both self-hosted by next/font at build with a system-font fallback if fetch fails.
const display = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata = { title: "Kudos", description: "Peer recognition" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen font-body">
        <Nav user={user} />
        <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
