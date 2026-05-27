const PLACEHOLDER_HOSTS = [
  "https://placehold.co/",
  "http://placehold.co/",
  "https://images.unsplash.com/",
  "http://images.unsplash.com/",
];

export function isOfficialJersey(src: string | null | undefined): boolean {
  if (!src) return false;
  return !PLACEHOLDER_HOSTS.some((host) => src.startsWith(host));
}

interface Props {
  src: string;
  alt: string;
  imgClassName?: string;
  wrapperClassName?: string;
  overlaySize?: "sm" | "md";
}

export default function JerseyImage({
  src,
  alt,
  imgClassName = "w-full h-full object-cover",
  wrapperClassName = "block w-full h-full",
  overlaySize = "md",
}: Props) {
  const official = isOfficialJersey(src);
  const overlayBadge =
    overlaySize === "sm"
      ? "text-[8px] px-1.5 py-0.5"
      : "text-[10px] px-2 py-1";

  return (
    <span className={`relative ${wrapperClassName}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`${imgClassName} ${official ? "" : "blur-[3px] brightness-50"}`}
      />
      {!official ? (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={`bg-black/75 text-white font-black uppercase tracking-widest rounded ${overlayBadge}`}
          >
            Coming soon
          </span>
        </span>
      ) : null}
    </span>
  );
}
