"use client";

import Link from "next/link";

const ITEMS = [
  { key: "home", label: "Home", href: "/account" },
  { key: "plan", label: "Plan", href: "/protocol" },
  { key: "tools", label: "Tools", href: "/vault" },
  { key: "record", label: "Record", href: "/ledger" },
];

export default function StarterNav({ current, preview = false }) {
  const suffix = preview ? "?preview=starter" : "";
  return (
    <nav className="starter-nav no-print" aria-label="Starter workspace">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={`${item.href}${suffix}`}
          className={current === item.key ? "active" : ""}
          aria-current={current === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
