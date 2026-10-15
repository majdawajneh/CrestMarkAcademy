"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: ReactNode;
  className: string;
  activeClassName: string;
  indicatorClassName: string;
  exact?: boolean;
};

export default function ActiveAdminLink({
  href,
  children,
  className,
  activeClassName,
  indicatorClassName,
  exact = false,
}: Props) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href || pathname === `${href}/`
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`${className}${active ? ` ${activeClassName}` : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
      {active && <span className={indicatorClassName} aria-hidden="true" />}
    </Link>
  );
}
