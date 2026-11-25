import React from "react";

export default function TpuLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect x="19" y="13" width="13.5" height="74" fill="currentColor" />
      <rect x="35.5" y="13" width="13.5" height="46" fill="currentColor" />
      <rect x="52" y="13" width="13.5" height="74" fill="currentColor" />
      <rect x="68.5" y="13" width="13.5" height="74" fill="currentColor" />
    </svg>
  );
}
