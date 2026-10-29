import { cn } from 'cn'
import decreaseIcon from '@/assets/figma/detail/quantity-decrease.svg'
import increaseIcon from '@/assets/figma/detail/quantity-increase.svg'
import mobileDecreaseIcon from '@/assets/figma/detail/mobile-quantity-decrease.svg'
import mobileIncreaseIcon from '@/assets/figma/detail/mobile-quantity-increase.svg'

type QuantityStepperProps = {
  quantity: number
  maxQuantity: number
  onDecrease: () => void
  onIncrease: () => void
  size: 'large' | 'compact'
}

const SIZE_STYLES = {
  large: {
    button: 'h-[49.5px] w-[33px] rounded-[33px] shadow-[0_6.6px_9.9px_rgba(20,13,10,0.15)]',
    iconSize: 26,
    decreaseIcon,
    increaseIcon,
    value: 'min-w-5 text-xl leading-7',
  },
  compact: {
    button: 'h-[30px] w-5 rounded-[20px] shadow-[0_4px_6px_rgba(20,13,10,0.15)]',
    iconSize: 16,
    decreaseIcon: mobileDecreaseIcon,
    increaseIcon: mobileIncreaseIcon,
    value: 'min-w-4 text-lg leading-[25px] font-medium',
  },
}

export function QuantityStepper({ quantity, maxQuantity, onDecrease, onIncrease, size }: QuantityStepperProps) {
  const styles = SIZE_STYLES[size]
  const buttonClass = cn(
    'grid shrink-0 place-items-center border border-ink bg-primary disabled:cursor-not-allowed disabled:opacity-40',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
    styles.button,
  )

  return (
    <div role="group" aria-label="Quantidade" className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= 1}
        aria-label="Diminuir quantidade"
        className={buttonClass}
      >
        <img src={styles.decreaseIcon} alt="" width={styles.iconSize} height={styles.iconSize} />
      </button>
      <output aria-live="polite" aria-label="Quantidade selecionada" className={cn('text-center', styles.value)}>
        {quantity}
      </output>
      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= maxQuantity}
        aria-label="Aumentar quantidade"
        className={buttonClass}
      >
        <img src={styles.increaseIcon} alt="" width={styles.iconSize} height={styles.iconSize} />
      </button>
    </div>
  )
}
