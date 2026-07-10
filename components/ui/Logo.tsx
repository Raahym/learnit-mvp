import Link from "next/link";

type LogoProps = {
  href?: string;
  size?: "sm" | "md";
  variant?: "light" | "dark";
};

export function Logo({ href = "/", size = "md", variant = "dark" }: LogoProps) {
  const boxSize = size === "sm" ? 24 : 28;
  const textClass = variant === "light" ? "text-sidebar-active" : "text-fg";

  const content = (
    <>
      <div
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 4,
          background: "var(--primary)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0
        }}
      >
        <span className="font-mono" style={{ color: "#fff", fontSize: size === "sm" ? 9 : 11, fontWeight: 700 }}>
          Li
        </span>
      </div>
      <span style={{ fontWeight: 600, fontSize: size === "sm" ? 13 : 14, letterSpacing: 0 }} className={textClass}>
        LearnIt
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>{content}</div>;
}
