import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import facebookIcon from '@/assets/figma/footer/social-facebook.svg'
import instagramIcon from '@/assets/figma/footer/social-instagram.svg'
import linkedinIcon from '@/assets/figma/footer/social-linkedin.svg'
import twitterIcon from '@/assets/figma/footer/social-twitter.svg'
import youtubeIcon from '@/assets/figma/footer/social-youtube.svg'
import type { NftCollectionId } from '@/features/nfts/nft.contracts'
import { NFT_COLLECTION_LABELS } from '@/features/nfts/nft-labels'

const FEATURE_HIGHLIGHTS = [
  {
    initial: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    initial: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    initial: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const PROFILE_LINKS = ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']
const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]
const FOOTER_COLLECTIONS: NftCollectionId[] = ['digital-art', 'photography', 'music', '3d-art', 'utility']

const SOCIAL_NETWORKS = [
  { name: 'Facebook', icon: facebookIcon },
  { name: 'Instagram', icon: instagramIcon },
  { name: 'Twitter', icon: twitterIcon },
  { name: 'LinkedIn', icon: linkedinIcon },
  { name: 'YouTube', icon: youtubeIcon },
]

function FooterColumnTitle({ children }: { children: string }) {
  return <h2 className="text-lg leading-4 font-bold">{children}</h2>
}

function UnavailableLinkList({ items }: { items: string[] }) {
  return (
    <ul className="text-sm leading-[30px]">
      {items.map((item) => (
        <li key={item}>
          <span aria-disabled="true" title="Disponível em breve">
            {item}
          </span>
        </li>
      ))}
    </ul>
  )
}

function NewsletterForm() {
  const [feedback, setFeedback] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('A inscrição na newsletter não está disponível nesta demonstração.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
        <div className="flex h-10 overflow-hidden rounded-md bg-surface-dark shadow-[0_0_10px_rgba(10,6,4,0.45)] focus-within:ring-2 focus-within:ring-ring">
          <label htmlFor="newsletter-email" className="sr-only">
            E-mail
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            placeholder="digite seu e-mail..."
            className="min-w-0 flex-1 bg-transparent pl-3 text-sm placeholder:text-brand-secondary focus:outline-none"
          />
          <button type="submit" className="w-[85px] rounded-r-md bg-primary text-lg leading-4 font-bold text-ink">
            Enviar
          </button>
        </div>
      </div>
      <p className="text-[13px] leading-[22px] text-text-secondary">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
      <p role="status" className="text-[13px] text-text-accent empty:hidden">
        {feedback}
      </p>
    </form>
  )
}

export function SiteFooter() {
  return (
    <footer className="page-container mt-24 max-md:hidden">
      <div className="grid gap-8 bg-surface-card p-8 md:grid-cols-2 xl:flex xl:items-stretch xl:gap-0">
        {FEATURE_HIGHLIGHTS.map((highlight) => (
          <section
            key={highlight.title}
            className="flex flex-col gap-3 px-4 xl:flex-1 xl:border-r xl:border-primary"
          >
            <span
              aria-hidden="true"
              className="grid size-[74px] place-items-center rounded-full bg-primary text-2xl font-bold text-ink"
            >
              {highlight.initial}
            </span>
            <h2 className="text-[17px] leading-4 font-bold">{highlight.title}</h2>
            <p className="max-w-[204px] text-sm leading-[22px] text-text-secondary">
              {highlight.description}
            </p>
          </section>
        ))}
        <div className="px-4 xl:w-[357px] xl:shrink-0">
          <NewsletterForm />
        </div>
      </div>

      <div className="grid items-center gap-x-[92px] gap-y-4 bg-surface-dark p-8 text-sm leading-[22px] md:grid-cols-2 xl:flex">
        <p className="flex-1 font-bold tracking-[0.1em]">KURIO</p>
        <p className="flex-1 whitespace-nowrap">
          Feito para colecionadores,
          <br />
          criadores e cultura
        </p>
        <a href="mailto:contato@email.com" className="flex-1 hover:text-text-accent">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="w-[228px] hover:text-text-accent">
          +55 11 4002 8922
        </a>
      </div>

      <div className="grid gap-8 bg-surface-card p-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_228px] xl:gap-[124px]">
        <section className="flex flex-col gap-2">
          <FooterColumnTitle>Meu perfil</FooterColumnTitle>
          <UnavailableLinkList items={PROFILE_LINKS} />
        </section>
        <section className="flex flex-col gap-2">
          <FooterColumnTitle>Central de ajuda</FooterColumnTitle>
          <UnavailableLinkList items={HELP_LINKS} />
        </section>
        <section className="flex flex-col gap-2">
          <FooterColumnTitle>Coleções</FooterColumnTitle>
          <ul className="text-sm leading-[30px]">
            {FOOTER_COLLECTIONS.map((collectionId) => (
              <li key={collectionId}>
                <Link
                  to="/"
                  search={{ collections: [collectionId] }}
                  hash="catalogo"
                  activeOptions={{ exact: true }}
                  className="hover:text-text-accent"
                >
                  {NFT_COLLECTION_LABELS[collectionId]}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-5">
            <FooterColumnTitle>Redes sociais</FooterColumnTitle>
            <ul className="flex gap-2.5">
              {SOCIAL_NETWORKS.map((network) => (
                <li key={network.name}>
                  <img src={network.icon} alt={network.name} width={32} height={32} />
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-3">
            <FooterColumnTitle>Carteiras compatíveis</FooterColumnTitle>
            <p className="flex h-[26px] items-center justify-center rounded-md border border-border-soft bg-surface-dark text-[9px] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
              {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
            </p>
          </section>
        </div>
      </div>

      <p className="py-1.5 text-center text-sm leading-[30px]">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
