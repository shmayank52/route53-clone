"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hosted zones", href: "/hosted-zones" },
  { label: "Traffic policies", href: "/traffic-policies" },
  { label: "Health checks", href: "/health-checks" },
  { label: "Resolver", href: "/resolver" },
  { label: "Profiles", href: "/profiles" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-awsSquidLight text-white min-h-[calc(100vh-40px)] hidden md:block">
      <div className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-300">
        Route 53
      </div>
      <nav className="flex flex-col">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm border-l-4 transition-colors ${
                active
                  ? "bg-[#152232] border-awsOrange text-white font-semibold"
                  : "border-transparent text-gray-200 hover:bg-[#28394e]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
