import React from "react";

interface CompanyLogoProps {
  size?: number;
  className?: string;
}

export default function CompanyLogo({ size = 120, className = "" }: CompanyLogoProps) {
  return (
    <img
      src="/logo.png"
      className={`${className} object-contain`}
      alt="Al-injaz Logo"
      referrerPolicy="no-referrer"
      style={{ width: size, height: size }}
    />
  );
}
