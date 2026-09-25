"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? "/hosted-zones" : "/login");
    }
  }, [loading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-awsBg">
      <p className="text-awsGray text-sm">Loading…</p>
    </div>
  );
}
