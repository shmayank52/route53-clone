"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import ComingSoon from "@/components/ComingSoon";

export default function Page() {
  return (
    <ProtectedLayout>
      <ComingSoon
        title="Profiles"
        description="Profiles let you associate a consistent set of DNS resources across multiple VPCs, even across AWS accounts."
      />
    </ProtectedLayout>
  );
}
