import shareEmailIcon from '@/assets/figma/detail/share-email.svg'
import shareLinkedinIcon from '@/assets/figma/detail/share-linkedin.svg'
import shareTwitterIcon from '@/assets/figma/detail/share-twitter.svg'

function buildShareTargets(nftName: string, pageUrl: string) {
  const url = encodeURIComponent(pageUrl)
  const text = encodeURIComponent(`${nftName} na Kurio`)

  return [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      icon: shareLinkedinIcon,
      width: 15,
      height: 14,
    },
    { label: 'e-mail', href: `mailto:?subject=${text}&body=${url}`, icon: shareEmailIcon, width: 18, height: 18 },
    {
      label: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      icon: shareTwitterIcon,
      width: 16,
      height: 12,
    },
  ]
}

export function NftShareLinks({ nftName }: { nftName: string }) {
  const shareTargets = buildShareTargets(nftName, window.location.href)

  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] leading-4 font-bold">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-2">
        {shareTargets.map((target) => (
          <li key={target.label}>
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Compartilhar por ${target.label} (abre em nova aba)`}
              className="grid place-items-center rounded-sm p-0.5 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <img src={target.icon} alt="" width={target.width} height={target.height} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
