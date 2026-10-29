import { cn } from 'cn'
import { useId } from 'react'
import facebookIcon from '@/assets/figma/auth/facebook.svg'
import googleBottomLeft from '@/assets/figma/auth/google-part-bottom-left.svg'
import googleBottomRight from '@/assets/figma/auth/google-part-bottom-right.svg'
import googleLeft from '@/assets/figma/auth/google-part-left.svg'
import googleRight from '@/assets/figma/auth/google-part-right.svg'
import googleRightShade from '@/assets/figma/auth/google-part-right-shade.svg'
import googleTop from '@/assets/figma/auth/google-part-top.svg'
import googleTopShade from '@/assets/figma/auth/google-part-top-shade.svg'
import type { AuthFormVariant } from './auth-text-field'

// Google mark parts positioned as in the Figma component (percentages of the 20px box).
const GOOGLE_MARK_PARTS = [
  { src: googleBottomLeft, className: 'inset-[57.68%_17.83%_0_7.11%]' },
  { src: googleBottomRight, className: 'top-[71.33%] right-[17.83%] bottom-0 left-1/2' },
  { src: googleLeft, className: 'inset-[24.69%_75.25%_24.69%_0]' },
  { src: googleRight, className: 'inset-[38.28%_0_11.97%_47.07%]' },
  { src: googleRightShade, className: 'top-[38.28%] right-0 bottom-[11.97%] left-1/2' },
  { src: googleTop, className: 'inset-[0_17.01%_57.68%_7.11%]' },
  { src: googleTopShade, className: 'top-0 right-[17.01%] bottom-[70.51%] left-1/2' },
]

function GoogleMark() {
  return (
    <span aria-hidden="true" className="relative size-5 shrink-0 overflow-hidden">
      {GOOGLE_MARK_PARTS.map((part) => (
        <img key={part.src} src={part.src} alt="" className={cn('absolute block', part.className)} />
      ))}
    </span>
  )
}

const SOCIAL_PROVIDERS = [
  { name: 'Google', mark: <GoogleMark /> },
  { name: 'Facebook', mark: <img src={facebookIcon} alt="" width={20} height={20} /> },
]

export function SocialSignIn({ variant }: { variant: AuthFormVariant }) {
  const reasonId = useId()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-[13px] leading-4">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span>Ou continue com</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <ul className={cn('flex flex-col', variant === 'dialog' ? 'gap-3 px-20' : 'gap-4')}>
        {SOCIAL_PROVIDERS.map((provider) => (
          <li key={provider.name}>
            <button
              type="button"
              aria-disabled="true"
              aria-describedby={reasonId}
              onClick={(event) => event.preventDefault()}
              className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] leading-4 font-medium text-text-secondary opacity-70"
            >
              {provider.mark}
              Continuar com {provider.name}
            </button>
          </li>
        ))}
      </ul>
      <p id={reasonId} className="sr-only">
        Login social indisponível nesta demonstração.
      </p>
    </div>
  )
}
