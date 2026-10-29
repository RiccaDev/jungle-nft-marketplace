// Static marketing artwork from the Figma file, served as optimized WebP copies.
function artworkSources(slug: string) {
  const basePath = `${import.meta.env.BASE_URL}images/nfts/${slug}`
  return {
    src: `${basePath}-480.webp`,
    srcSet: `${basePath}-480.webp 480w, ${basePath}-960.webp 960w`,
  }
}

export const HOME_ARTWORK = {
  sunglassesVarsity: {
    ...artworkSources('ape-sunglasses-varsity'),
    alt: 'Macaco ilustrado com óculos redondos e jaqueta universitária verde',
  },
  bucketHatHoodie: {
    ...artworkSources('ape-bucket-hat-hoodie'),
    alt: 'Gorila ilustrado com chapéu bucket verde e moletom lilás',
  },
  turtleneckBlazer: {
    ...artworkSources('ape-turtleneck-blazer'),
    alt: 'Macaco ilustrado com gola alta verde e blazer bege',
  },
  headphonesJacket: {
    ...artworkSources('ape-headphones-jacket'),
    alt: 'Orangotango ilustrado com fones de ouvido e jaqueta clara',
  },
}
