"use client";

import { useEffect } from "react";

export default function WorkspaceEntry({ destination }: { destination: string }) {
  useEffect(() => {
    window.location.replace(destination + window.location.search + window.location.hash);
  }, [destination]);
  return <main><p><a href={destination}>워크스페이스 열기</a></p></main>;
}
