/**
 * 10 Canonical Miogram Badges from the official design system:
 * 01 - ORIGINAL (Classic winged heart with antenna)
 * 02 - PINK (Neon pink style)
 * 03 - CYAN (Cyber sky blue style)
 * 04 - DARK (Obsidian with velvet purple edge glow)
 * 05 - ANGEL (Floating halo with lavender heart)
 * 06 - DEVIL (Devil horns & bat wings)
 * 07 - RAINBOW (Prismatic spectrum wings)
 * 08 - OUTLINE (Crisp wireframe pixel contour)
 * 09 - GLITCH (Split RGB displacement glitch)
 * 10 - PREMIUM (Golden royal crown & golden wings)
 */

import { MiogramLocale } from '../localizer/MiogramLocale';

export interface BadgeDefinition {
  id: string;
  code: string;
  titleUk: string;
  titleRu: string;
  titleEn: string;
  primaryColor: string;
  secondaryColor: string;
  icon: string;
  glowColor: string;
}

export const CANONICAL_BADGES: Record<string, BadgeDefinition> = {
  original: {
    id: 'original',
    code: '01 — ORIGINAL',
    titleUk: 'Класичний варіант',
    titleRu: 'Классический вариант',
    titleEn: 'Classic style',
    primaryColor: '#FF69B4',
    secondaryColor: '#FF1493',
    icon: '໒꒱',
    glowColor: 'rgba(255, 105, 180, 0.4)',
  },
  pink: {
    id: 'pink',
    code: '02 — PINK',
    titleUk: 'Рожевий стиль',
    titleRu: 'Розовый стиль',
    titleEn: 'Pink style',
    primaryColor: '#FF2D55',
    secondaryColor: '#FF69B4',
    icon: '✦',
    glowColor: 'rgba(255, 45, 85, 0.4)',
  },
  cyan: {
    id: 'cyan',
    code: '03 — CYAN',
    titleUk: 'Блакитний стиль',
    titleRu: 'Голубой стиль',
    titleEn: 'Cyan style',
    primaryColor: '#00D2FF',
    secondaryColor: '#007AFF',
    icon: '✧',
    glowColor: 'rgba(0, 210, 255, 0.4)',
  },
  dark: {
    id: 'dark',
    code: '04 — DARK',
    titleUk: 'Темний варіант',
    titleRu: 'Темный вариант',
    titleEn: 'Dark style',
    primaryColor: '#8A2BE2',
    secondaryColor: '#1A1A1A',
    icon: '◆',
    glowColor: 'rgba(138, 43, 226, 0.3)',
  },
  angel: {
    id: 'angel',
    code: '05 — ANGEL',
    titleUk: 'З німбом',
    titleRu: 'С нимбом',
    titleEn: 'Angel with halo',
    primaryColor: '#E6E6FA',
    secondaryColor: '#FFD700',
    icon: '🪽',
    glowColor: 'rgba(255, 215, 0, 0.4)',
  },
  devil: {
    id: 'devil',
    code: '06 — DEVIL',
    titleUk: 'З ріжками',
    titleRu: 'С рожками',
    titleEn: 'Devil with horns',
    primaryColor: '#FF3B30',
    secondaryColor: '#8B0000',
    icon: '🦇',
    glowColor: 'rgba(255, 59, 48, 0.4)',
  },
  rainbow: {
    id: 'rainbow',
    code: '07 — RAINBOW',
    titleUk: 'Веселковий',
    titleRu: 'Радужный',
    titleEn: 'Rainbow style',
    primaryColor: '#FF007F',
    secondaryColor: '#00F0FF',
    icon: '🌈',
    glowColor: 'rgba(255, 0, 127, 0.4)',
  },
  outline: {
    id: 'outline',
    code: '08 — OUTLINE',
    titleUk: 'Контурний',
    titleRu: 'Контурный',
    titleEn: 'Outline style',
    primaryColor: '#FFFFFF',
    secondaryColor: '#A0A0A0',
    icon: '◇',
    glowColor: 'rgba(255, 255, 255, 0.25)',
  },
  glitch: {
    id: 'glitch',
    code: '09 — GLITCH',
    titleUk: 'Глітч-стиль',
    titleRu: 'Глитч-стиль',
    titleEn: 'Glitch style',
    primaryColor: '#FF0055',
    secondaryColor: '#00FFFF',
    icon: '⚡',
    glowColor: 'rgba(0, 255, 255, 0.5)',
  },
  premium: {
    id: 'premium',
    code: '10 — PREMIUM',
    titleUk: 'Преміум варіант',
    titleRu: 'Премиум вариант',
    titleEn: 'Premium style',
    primaryColor: '#FFD700',
    secondaryColor: '#FFA500',
    icon: '👑',
    glowColor: 'rgba(255, 215, 0, 0.5)',
  },
};

export class MiogramBadgeType {
  public static getAll(): BadgeDefinition[] {
    return Object.values(CANONICAL_BADGES);
  }

  public static getById(id?: string): BadgeDefinition {
    if (!id) return CANONICAL_BADGES.original;
    const clean = id.trim().toLowerCase();
    return CANONICAL_BADGES[clean] || CANONICAL_BADGES.original;
  }

  public static getTitle(badge: BadgeDefinition): string {
    return MiogramLocale.get(badge.titleUk, badge.titleRu, badge.titleEn);
  }
}

export default MiogramBadgeType;
