type BannerConfig = { src: string; position: string };

const BANNERS: Record<string, BannerConfig> = {
  benson: { src: '/banners/fizz.jpg',      position: 'center 15%' },
  dean:   { src: '/banners/ahri.jpg',      position: 'center 15%' },
  jimmy:  { src: '/banners/samira.avif',   position: 'center 15%' },
  andrew: { src: '/banners/mf.avif',       position: 'center 5%'  },
};

export function getPlayerBanner(displayName: string): BannerConfig | null {
  return BANNERS[displayName.toLowerCase()] ?? null;
}
