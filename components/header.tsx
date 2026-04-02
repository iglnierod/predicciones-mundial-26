"use client";

import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "HOME", href: "/" },
  { label: "GRUPOS", href: "/groups" },
  { label: "PARTIDOS", href: "/matches" },
  { label: "CLASIFICACIÓN", href: "/leaderboard" },
  { label: "REGLAS", href: "/rules" },
];

type HeaderProps = {
  currentPath?: string;
  onLogout?: () => void;
};

export default function Header({
  currentPath = "/groups",
  onLogout,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout?.();
  };

  return (
    <header className="w-full px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-bl-4xl rounded-tr-4xl bg-[#2A398D] shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
          <div className="flex min-h-20 items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="shrink-0 text-lg font-extrabold tracking-tight text-white sm:text-xl"
            >
              WORLD CUP 2026
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              {navItems.map((item) => {
                const isActive = currentPath === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative text-sm font-semibold tracking-wide transition ${
                      isActive ? "text-white" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-6 lg:flex">
              <Link
                href="/profile"
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Profile"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2A398D] transition hover:bg-white/90"
              >
                CERRAR SESIÓN
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-2xl bg-white/10 p-2 text-white transition hover:bg-white/20 lg:hidden"
              aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {isOpen && (
            <div className="border-t border-white/10 px-5 pb-5 pt-3 sm:px-6 lg:hidden">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = currentPath === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition ${
                        isActive
                          ? "bg-white text-[#2A398D]"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="my-4 h-px bg-white/10" />

              <div className="flex flex-col gap-2">
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide text-white/90 transition hover:bg-white/10 hover:text-white"
                >
                  <User className="h-5 w-5" />
                  PERFIL
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold text-[#2A398D] transition hover:bg-white/90"
                >
                  CERRAR SESIÓN
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
