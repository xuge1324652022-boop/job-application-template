import type { Bi, Capability, Experience, Work } from './人物资料'
import type { VisualAsset } from './视觉作品资料'

interface PersonalPortfolio {
  profile: {
    IDENTITY: {
      nameZh: string
      nameEn: string
      initials: string
      en: { title: string; short: string }
      zh: { title: string }
    }
    TAGLINE: Bi
    ROLE_LINE: Bi
    FACTS: { k: Bi; v: Bi }[]
    RESUME_SKILLS: { id: string; title: Bi; body: Bi }[]
    PROFILE_LINES: Bi[]
    CAPABILITIES: Capability[]
    CHAT: { q: Bi; a: Bi }[]
    WORKS: Work[]
    EXPERIENCE: Experience[]
    CONTACT: { email: string; gmail: string; resume: string; portfolio: string; phones?: string[] }
  }
  portrait: VisualAsset
  portraits?: {
    hero?: VisualAsset
    quote?: VisualAsset
    card?: VisualAsset
    profile?: VisualAsset
  }
  selectedWorks: VisualAsset[]
  storyPanels: { key: string; assetId: string; label: Bi; title: Bi; copy: Bi; href: string }[]
  imageDimensions: Record<string, { width: number; height: number }>
}

// The personal content pack stays local; a checkout without it remains a usable template.
const content =
  typeof document === 'undefined'
    ? null
    : document.getElementById('personal-portfolio')?.textContent
export const personalPortfolio: PersonalPortfolio | null = content
  ? (JSON.parse(content) as PersonalPortfolio)
  : null
export const isPersonalPortfolio = personalPortfolio !== null

export const aboutPortrait: VisualAsset = personalPortfolio?.portrait ?? {
  id: 'profile-portrait',
  title: { zh: '合成人物示例', en: 'Synthetic portrait example' },
  alt: {
    zh: '用于个人简介版式演示的合成几何占位图',
    en: 'Synthetic geometric placeholder for the profile layout',
  },
  thumb: '/about/portrait-400.webp',
  src: '/about/portrait-900.webp',
  large: '/about/portrait-1448.webp',
  width: 1448,
  height: 1086,
}

/** Scene-specific assets are optional; existing packs and the template keep their portrait. */
export const aboutHeroPortrait: VisualAsset = personalPortfolio?.portraits?.hero ?? aboutPortrait
export const aboutQuotePortrait: VisualAsset = personalPortfolio?.portraits?.quote ?? aboutPortrait
export const aboutCardPortrait: VisualAsset = personalPortfolio?.portraits?.card ?? aboutPortrait
export const aboutProfilePortrait: VisualAsset =
  personalPortfolio?.portraits?.profile ?? aboutPortrait
