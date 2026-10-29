import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import mobileBackArrowIcon from '@/assets/figma/detail/mobile-back-arrow.svg'

export function BackButton() {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/' }))}
      className="grid size-[35px] shrink-0 place-items-center rounded-full border border-border bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <img src={mobileBackArrowIcon} alt="" width={13} height={7} className="rotate-90" />
    </button>
  )
}
