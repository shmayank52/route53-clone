"use client";

import React from "react";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-awsBorder text-sm text-awsGray">
      <span>
        {start}-{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          className="px-2 py-1 border border-awsBorder rounded-[3px] disabled:opacity-40 hover:bg-awsBg"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
        <span className="px-2">
          Page {page} of {totalPages}
        </span>
        <button
          className="px-2 py-1 border border-awsBorder rounded-[3px] disabled:opacity-40 hover:bg-awsBg"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
