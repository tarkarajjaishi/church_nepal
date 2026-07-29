"use client";

import { useTheme } from "./theme-provider";
import Image from "next/image";
import { useState, useEffect } from "react";

type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 40, className }: LogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let src = "/logo-dark.png"; // Default before mounting or if theme is dark
  if (mounted && theme === "light") {
    src = "/logo-light.png";
  }

  return (
    <Image
      src={src}
      alt="ChurchNepal logo"
      width={size}
      height={size}
      priority
      className={`rounded-lg object-contain ${className ?? ""}`}
    />
  );
}
