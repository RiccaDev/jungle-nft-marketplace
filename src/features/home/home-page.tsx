import { NftCatalog } from '@/features/nfts/components/nft-catalog'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { HomeBlog } from './home-blog'
import { HomeHero } from './home-hero'
import { HomePromos } from './home-promos'
import { MobileCatalogSearchBar } from './mobile-catalog-search-bar'
import { MobileHomeHero } from './mobile-home-hero'

export function HomePage() {
  // Rendered conditionally (not hidden with CSS) so only one hero image is downloaded.
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)

  return (
    <>
      {isDesktop ? (
        <HomeHero />
      ) : (
        <div className="page-container flex flex-col gap-4 pt-10 pb-4">
          <MobileCatalogSearchBar />
          <MobileHomeHero />
        </div>
      )}
      <NftCatalog />
      <HomePromos />
      <HomeBlog />
    </>
  )
}
