import { HOME_ARTWORK } from './home-artwork'

const BLOG_POSTS = [
  {
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    artwork: HOME_ARTWORK.turtleneckBlazer,
  },
  {
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    artwork: HOME_ARTWORK.sunglassesVarsity,
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    artwork: HOME_ARTWORK.bucketHatHoodie,
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    artwork: HOME_ARTWORK.headphonesJacket,
  },
]

export function HomeBlog() {
  return (
    <section aria-labelledby="home-blog-title" className="page-container mt-24 max-md:hidden">
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-3 text-center">
          <h2 id="home-blog-title" className="text-[28px] font-bold text-text-primary">
            Diário da Cunhagem
          </h2>
          <p className="text-sm text-text-secondary">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </header>

        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {BLOG_POSTS.map((post) => (
            <li key={post.title}>
              <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface-card">
                <img
                  src={post.artwork.src}
                  srcSet={post.artwork.srcSet}
                  sizes="(min-width: 1024px) 282px, 50vw"
                  alt=""
                  width={282}
                  height={195}
                  loading="lazy"
                  decoding="async"
                  className="h-[195px] w-full object-cover"
                />
                <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                  <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-text-secondary">
                    {`${post.date}  |  ${post.readingTime}`}
                  </p>
                  <h3 className="text-base font-bold text-text-primary">{post.title}</h3>
                  <p className="text-xs leading-4 font-medium text-text-secondary">{post.excerpt}</p>
                  <p
                    aria-disabled="true"
                    title="Disponível em breve"
                    className="mt-auto flex gap-1 text-xs text-text-accent"
                  >
                    <span className="leading-[14px] font-bold">Ler mais</span>
                    <span aria-hidden="true">→</span>
                    <span className="sr-only">(artigo indisponível nesta demonstração)</span>
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
