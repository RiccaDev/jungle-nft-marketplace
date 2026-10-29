import { cn } from 'cn'
import { useId, useState, type FormEvent } from 'react'
import { readApiError } from '@/lib/http/api-error'
import type { Cart, CartQuote } from '../cart.contracts'
import { useApplyCartCoupon, useRemoveCartCoupon } from '../use-cart'

type CouponFormProps = {
  cart: Cart
  quote: CartQuote | undefined
  variant: 'desktop' | 'mobile'
}

export function CouponForm({ cart, quote, variant }: CouponFormProps) {
  const inputId = useId()
  const errorId = useId()
  const [code, setCode] = useState('')
  const applyCoupon = useApplyCartCoupon()
  const removeCoupon = useRemoveCartCoupon()
  const errorMessage = applyCoupon.error
    ? (readApiError(applyCoupon.error)?.message ?? 'Não foi possível aplicar o cupom.')
    : null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!code.trim()) return
    applyCoupon.mutate(code.trim(), { onSuccess: () => setCode('') })
  }

  if (cart.couponCode) {
    const description = quote?.coupon?.code === cart.couponCode ? quote.coupon.description : null
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[15px] leading-4 font-bold">Código promocional</p>
        <div className="flex items-center justify-between gap-3 rounded-[5px] border border-primary/60 px-3 py-2 text-sm">
          <p data-testid="applied-coupon">
            <span className="font-bold text-text-accent">{cart.couponCode}</span>
            {description && <span className="text-text-secondary"> · {description}</span>}
          </p>
          <button
            type="button"
            onClick={() => removeCoupon.mutate()}
            disabled={removeCoupon.isPending}
            className="text-text-secondary underline-offset-2 hover:text-foreground hover:underline"
          >
            Remover
          </button>
        </div>
        {quote?.couponIssue === 'expired' && (
          <p role="alert" className="text-sm text-text-coral">
            Este cupom expirou e não está sendo aplicado.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={inputId} className={cn('text-[15px] leading-4 font-bold', variant === 'mobile' && 'sr-only')}>
        Código promocional
      </label>
      <div
        className={cn(
          'flex overflow-hidden border focus-within:border-primary',
          variant === 'desktop' ? 'h-10 rounded-[5px]' : 'h-[50px] rounded-[10px]',
          errorMessage ? 'border-text-coral' : 'border-border',
        )}
      >
        <input
          id={inputId}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-brand-secondary focus:outline-none md:px-2"
        />
        <button
          type="submit"
          disabled={applyCoupon.isPending}
          className={cn(
            'shrink-0 bg-primary text-base leading-4 font-bold text-ink hover:bg-primary/90 disabled:opacity-70',
            variant === 'desktop' ? 'w-[102px]' : 'w-[97px]',
          )}
        >
          {applyCoupon.isPending ? '…' : 'Aplicar'}
        </button>
      </div>
      <p id={errorId} role="alert" className="text-sm text-text-coral empty:hidden">
        {errorMessage}
      </p>
    </form>
  )
}
