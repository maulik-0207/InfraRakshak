"use client"

import Image from "next/image"

export function SidebarHeader() {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <Image
        src="/logo.png"
        alt="InfraRakshak Logo"
        width={150}
        height={55}
        style={{ height: "auto" }}
        className="object-contain"
        priority
      />
    </div>
  )
}
