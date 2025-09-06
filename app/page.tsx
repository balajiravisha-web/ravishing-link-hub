import Link from "next/link";

export default function Home() {
  return (
    <main className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Ravishing Ravisha</h1>
        <p className="text-sm text-neutral-600">links.ravishingravisha.in</p>
      </header>

      <section className="grid gap-4">
        <Link href="/c/melasma" className="block rounded-2xl shadow-soft p-4 bg-white">
          <div className="font-medium">My Melasma Routine</div>
          <div className="text-xs text-neutral-600">Tap to view</div>
        </Link>
        <Link href="/c/anti-acne" className="block rounded-2xl shadow-soft p-4 bg-white">
          <div className="font-medium">Best Anti Acne Products</div>
          <div className="text-xs text-neutral-600">Tap to view</div>
        </Link>
        <Link href="/c/oily-skin-toners" className="block rounded-2xl shadow-soft p-4 bg-white">
          <div className="font-medium">Oily Skin Toners</div>
          <div className="text-xs text-neutral-600">Tap to view</div>
        </Link>
      </section>

      <footer className="text-center text-xs text-neutral-500 pt-8">
        © {new Date().getFullYear()} Ravishing Ravisha
      </footer>
    </main>
  );
}