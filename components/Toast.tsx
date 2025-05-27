import React from "react";

export default function Toast({
  toastRef,
  success,
}: {
  toastRef: React.RefObject<HTMLDivElement>;
  success: string;
}) {
  return (
    <div
      ref={toastRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded shadow-lg transition-opacity duration-500"
      style={{ opacity: 1 }}
    >
      {success}
    </div>
  );
}
