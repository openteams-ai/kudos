import "./globals.css";
export const metadata = { title: "Kudos", description: "Peer recognition" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <header className="border-b bg-white px-6 py-4">
        <nav className="mx-auto flex max-w-3xl gap-6 font-medium">
          <a href="/">Feed</a><a href="/rewards">Rewards</a>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </body></html>
  );
}
