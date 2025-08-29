"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspacePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sponsors");
  }, [router]);

  return null;
}
