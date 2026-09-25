"use client";
import ProtectedLayout from "@/components/ProtectedLayout";
import ComingSoon from "@/components/ComingSoon";

export default function Page() {
  return (
    <ProtectedLayout>
      <ComingSoon
        title="Health checks"
        description="Monitor the health and performance of your application, web servers, and other resources."
      />
    </ProtectedLayout>
  );
}
