"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      toastOptions={{
        className: "!rounded-xl",
      }}
      position="top-right"
    />
  );
}
