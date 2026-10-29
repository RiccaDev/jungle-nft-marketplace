import { cn } from 'cn'

type AccountAvatarProps = {
  displayName: string
  // Uploaded image (or a preview of the chosen file); null shows the initials.
  src: string | null
  size: number
  alt?: string
  className?: string
}

function initials(displayName: string) {
  const words = displayName.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

export function AccountAvatar({ displayName, src, size, alt, className }: AccountAvatarProps) {
  const style = { width: size, height: size }
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? `Avatar de ${displayName}`}
        width={size}
        height={size}
        style={style}
        className={cn('shrink-0 rounded-full border border-primary/60 object-cover', className)}
      />
    )
  }
  return (
    <span
      role="img"
      aria-label={alt ?? `Avatar de ${displayName} (iniciais)`}
      style={{ ...style, fontSize: size * 0.36 }}
      className={cn('grid shrink-0 place-items-center rounded-full bg-primary font-bold text-ink', className)}
    >
      {initials(displayName)}
    </span>
  )
}
