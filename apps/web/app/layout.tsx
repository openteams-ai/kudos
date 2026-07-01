import "./globals.css";
import { auth, signIn, signOut } from "../auth";

export const metadata = { title: "Kudos", description: "Peer recognition" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  return (
    <html lang="en"><body>
      <header className="border-b bg-white px-6 py-4">
        <nav className="mx-auto flex max-w-3xl items-center gap-6 font-medium">
          <a href="/">Feed</a>
          <a href="/rewards">Rewards</a>
          <div className="ml-auto">
            {user ? (
              <form action={async () => { "use server"; await signOut(); }} className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{user.name}</span>
                <button className="rounded-lg border px-3 py-1 text-sm">Sign out</button>
              </form>
            ) : (
              <form action={async () => { "use server"; await signIn("slack"); }}>
                <button className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white">Sign in with Slack</button>
              </form>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </body></html>
  );
}
