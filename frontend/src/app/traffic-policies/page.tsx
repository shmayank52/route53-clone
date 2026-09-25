"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import ComingSoon from "@/components/ComingSoon";

export default function Page() {
  return (
    <ProtectedLayout>
      <ComingSoon
        title="Traffic policies"
        description="Use traffic flow to route traffic based on multiple criteria, such as endpoint health, geographic location, and latency."
      />
    </ProtectedLayout>
  );
}
