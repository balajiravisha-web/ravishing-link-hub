import "./globals.css";

export const metadata = {
  title: "Ravishing Link Hub",
  description: "links.ravishingravisha.in"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md p-4">
          {children}
        </div>
      </body>
    </html>
  );
}