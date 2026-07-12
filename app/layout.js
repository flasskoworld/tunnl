import "./globals.css";

export const metadata = {
  title: "TUNNL — The Tunnel OS",
  description:
    "An operating system for people who build. Seventeen questions. Nine modules. One operating memo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
