"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import ComingSoon from "@/components/ComingSoon";

export default function Page() {
  return (
    <ProtectedLayout>
      <ComingSoon
        title="Resolver"
        description="Route 53 Resolver responds recursively to DNS queries from AWS resources for public records, and Route 53 private hosted zone records."
      />
    </ProtectedLayout>
  );
}
