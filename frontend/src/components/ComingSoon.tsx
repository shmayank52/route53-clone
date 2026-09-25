"use client";

import React from "react";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-awsText mb-1">{title}</h1>
      <p className="text-sm text-awsGray mb-6">{description}</p>
      <div className="aws-panel p-12 flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-3">🚧</div>
        <h2 className="text-lg font-semibold text-awsText mb-1">Coming soon</h2>
        <p className="text-sm text-awsGray max-w-md">
          This section is not yet implemented in this demo console. In the real AWS Route 53
          console, this is where you would manage {title.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}
