import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 mb-6 w-full px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-tl-4xl rounded-br-4xl bg-[#2f3034] shadow-[0_12px_40px_rgba(0,0,0,0.28)] ring-1 ring-white/5">
          <div className="flex flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">
                © 2026 Rodrigo Iglesias Nieto
              </p>
              <p className="mt-1 text-sm text-white/60">
                Predicciones Mundial 2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="https://github.com/iglnierod/predicciones-mundial-26"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
                title="Repositorio del proyecto"
              >
                <Image
                  src="/github.svg"
                  alt="GitHub"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>

              <Link
                href="https://www.linkedin.com/in/rodrigo-iglesias-nieto/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
                title="Mi LinkedIn"
              >
                <Image
                  src="/brand-linkedin.svg"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>

              <Link
                href="mailto:iglnierod@correo.com"
                aria-label="Email"
                className="rounded-full bg-white/10 p-3 transition hover:bg-white/20"
                title="Mi e-mail"
              >
                <Image
                  src="/mail.svg"
                  alt="Email"
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
