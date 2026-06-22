import { ReactNode } from "react";

type AdminSectionShellProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
};

export function AdminSectionShell({
  title,
  description,
  eyebrow,
  children,
}: AdminSectionShellProps) {
  return (
    <section className="card admin-section min-w-0 overflow-hidden p-5 sm:p-6">
      <div className="border-b border-white/[0.07] pb-5">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm text-zinc-400">{description}</p>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
