"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function TopNav() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="h-10 bg-awsSquid text-white flex items-center justify-between px-3 text-sm relative z-30">
      <div className="flex items-center gap-4">
        <Link href="/hosted-zones" className="font-bold text-white flex items-center gap-1.5">
          <span className="text-awsOrange text-lg leading-none">▲</span>
          <span>aws</span>
        </Link>
        <span className="text-gray-400">|</span>
        <span className="font-semibold">Route 53</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-300 hidden sm:inline">
          Account: {user?.account_id?.slice(0, 12) || "000000000000"}
        </span>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10"
          >
            <span className="w-5 h-5 rounded-full bg-awsOrange text-awsSquid flex items-center justify-center text-[10px] font-bold">
              {(user?.full_name || user?.email || "U").slice(0, 1).toUpperCase()}
            </span>
            <span>{user?.full_name || user?.email}</span>
            <span className="text-[10px]">▾</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-1 w-44 bg-white text-awsText rounded-[3px] shadow-lg py-1">
              <div className="px-3 py-2 text-xs text-awsGray border-b border-awsBorder truncate">
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm hover:bg-awsBg"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
