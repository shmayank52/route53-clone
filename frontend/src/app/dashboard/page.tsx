"use client";

import React, { useEffect, useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api } from "@/lib/api";
import { HostedZoneList } from "@/types";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<{ zones: number; records: number } | null>(null);

  useEffect(() => {
    api
      .get<HostedZoneList>("/api/hosted-zones", { params: { page: 1, page_size: 100 } })
      .then((res) => {
        const zones = res.data.total;
        const records = res.data.items.reduce((acc, z) => acc + z.record_count, 0);
        setStats({ zones, records });
      })
      .catch(() => setStats({ zones: 0, records: 0 }));
  }, []);

  return (
    <ProtectedLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-awsText mb-1">Route 53 Dashboard</h1>
        <p className="text-sm text-awsGray mb-6">
          Get started with Amazon Route 53 — a scalable and highly available Domain Name System (DNS).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link href="/hosted-zones" className="aws-panel p-4 hover:shadow-md transition-shadow">
            <p className="text-xs text-awsGray uppercase font-semibold">Hosted zones</p>
            <p className="text-2xl font-bold text-awsText mt-1">{stats?.zones ?? "…"}</p>
          </Link>
          <div className="aws-panel p-4">
            <p className="text-xs text-awsGray uppercase font-semibold">DNS records</p>
            <p className="text-2xl font-bold text-awsText mt-1">{stats?.records ?? "…"}</p>
          </div>
          <Link href="/health-checks" className="aws-panel p-4 hover:shadow-md transition-shadow">
            <p className="text-xs text-awsGray uppercase font-semibold">Health checks</p>
            <p className="text-2xl font-bold text-awsText mt-1">0</p>
          </Link>
        </div>

        <div className="aws-panel p-5">
          <h2 className="text-lg font-semibold text-awsText mb-3">Get started</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/hosted-zones" className="text-awsBlue hover:underline">
                Create a hosted zone
              </Link>{" "}
              <span className="text-awsGray">— register a domain namespace within Route 53.</span>
            </li>
            <li>
              <span className="text-awsGray">
                Add records to a hosted zone to route traffic for your domain.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  );
}
