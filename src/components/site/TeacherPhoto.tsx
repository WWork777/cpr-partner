import { useState } from "react";

export function TeacherPhoto({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}: фото не добавлено`}
        className={`bg-muted ${className}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
