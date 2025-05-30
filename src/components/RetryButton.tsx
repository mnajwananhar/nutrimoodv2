"use client";

import { RefreshCw } from "lucide-react";

interface RetryButtonProps {
  className?: string;
}

export default function RetryButton({ className }: RetryButtonProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <button onClick={handleRetry} className={className}>
      <RefreshCw className="w-5 h-5 mr-2" />
      Coba Lagi
    </button>
  );
}
