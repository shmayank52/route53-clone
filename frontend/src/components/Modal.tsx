"use client";

import React from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export default function Modal({ title, onClose, children, footer, width = "max-w-lg" }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className={`bg-white rounded-[3px] shadow-xl w-full ${width} flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-awsBorder">
          <h2 className="text-lg font-semibold text-awsText">{title}</h2>
          <button onClick={onClose} className="text-awsGray hover:text-awsText text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-awsBorder flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
