"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPortalLink() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);

  const enter = (event) => {
    if (entering) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    setEntering(true);
    document.querySelector(".home-shell")?.classList.add("portal-entering");
    window.setTimeout(() => router.push("/diagnostic"), 650);
  };

  return (
    <Link href="/diagnostic" className="btn home-cta" onClick={enter} aria-busy={entering}>
      {entering ? "Entering..." : "Enter The Tunnel"}
    </Link>
  );
}
