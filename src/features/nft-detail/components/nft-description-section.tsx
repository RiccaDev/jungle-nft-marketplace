import type { NftDetail } from '@/features/nfts/nft.contracts'

export function NftDescriptionSection({ nft }: { nft: NftDetail }) {
  return (
    <section aria-labelledby="nft-description-title" className="flex flex-col gap-3">
      <div className="relative flex gap-6 overflow-x-auto border-b border-primary/40 text-sm leading-4 whitespace-nowrap md:gap-8 md:text-[17px]">
        <h2 id="nft-description-title" className="flex flex-col gap-3 font-bold text-text-accent after:h-[3px] after:bg-primary after:content-['']">
          Detalhes do NFT
        </h2>
        <p aria-disabled="true" title="Disponível em breve">
          Avaliações de colecionadores ({nft.rating.reviewCount})
          <span className="sr-only"> (disponível em breve)</span>
        </p>
      </div>

      <div className="flex flex-col gap-6 text-sm leading-6 text-text-secondary">
        {nft.description.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <dl className="flex flex-col gap-3 text-sm leading-6">
        <div>
          <dt className="font-bold">Rede:</dt>
          <dd className="text-text-secondary">{nft.networkDescription}</dd>
        </div>
        <div>
          <dt className="font-bold">Contrato:</dt>
          <dd className="text-text-secondary">
            {nft.contractAddress} • Contrato inteligente {nft.contractStandard} verificado.
          </dd>
        </div>
        <div>
          <dt className="font-bold">Direitos autorais:</dt>
          <dd className="text-text-secondary">
            Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
            automaticamente pelos mercados compatíveis.
          </dd>
        </div>
      </dl>
    </section>
  )
}
