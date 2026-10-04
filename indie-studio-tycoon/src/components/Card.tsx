import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

function CardHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  if (!title && !subtitle) return null;
  return (
    <div className="card-header">
      {title && <div className="card-title">{title}</div>}
      {subtitle && <div className="card-subtitle">{subtitle}</div>}
    </div>
  );
}

export default function Card({ children, title, subtitle, className, onClick }: CardProps) {
  const classes = ["card", onClick ? "card-clickable" : "", className].filter(Boolean).join(" ");
  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        <CardHeader title={title} subtitle={subtitle} />
        {children}
      </button>
    );
  }
  return (
    <div className={classes}>
      <CardHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}
