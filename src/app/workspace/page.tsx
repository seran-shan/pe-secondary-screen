"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/workspace/sponsors");
  }, [router]);

  return null;
}
