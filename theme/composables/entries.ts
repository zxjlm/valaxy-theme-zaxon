import type { Post } from 'valaxy'
import { computed } from 'vue'
import { useThemeConfig } from './config'

export type EntryKind = 'article' | 'life' | 'note' | 'photo' | 'quote'

const ENTRY_LABELS: Record<EntryKind, string> = {
  article: 'ARTICLE',
  life: 'LIFE',
  note: 'NOTE',
  photo: 'PHOTO',
  quote: 'QUOTE',
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(item => String(item))
  return value ? [String(value)] : []
}

function fieldValue(post: Post, key: string) {
  return (post as any)[key] ?? (post as any).frontmatter?.[key]
}

/**
 * 文章的全部分类名（含嵌套子分类），保留原始大小写以便与配置精确匹配。
 */
export function postCategories(post: Post): string[] {
  return asArray(fieldValue(post, 'categories'))
}

function postText(post: Post): string {
  return [
    post.title,
    post.excerpt,
    fieldValue(post, 'type'),
    ...asArray(fieldValue(post, 'tags')),
    ...postCategories(post),
  ].join(' ').toLowerCase()
}

/**
 * 基于关键词的细分类型，用于首页 chips / 文案，不依赖站点配置。
 */
export function entryKind(post: Post): EntryKind {
  const text = postText(post)

  if (/photo|摄影|旅行|照片|胶片/.test(text))
    return 'photo'
  if (/quote|摘录|引用|句子/.test(text))
    return 'quote'
  if (/note|笔记|备忘|随记|灵感/.test(text))
    return 'note'
  if (/life|生活|阅读|音乐|咖啡/.test(text))
    return 'life'

  return 'article'
}

export function entryLabel(post: Post): string {
  return ENTRY_LABELS[entryKind(post)]
}

/**
 * dev / life 归类：优先看配置的顶级分类，回退到关键词。
 */
export function useFieldEntries() {
  const themeConfig = useThemeConfig()
  const lifeCategories = computed(() => themeConfig.value?.content?.lifeCategories ?? [])
  const devCategories = computed(() => themeConfig.value?.content?.devCategories ?? [])

  function isLife(post: Post): boolean {
    const cats = postCategories(post)

    if (lifeCategories.value.length && cats.some(cat => lifeCategories.value.includes(cat)))
      return true
    if (devCategories.value.length && cats.some(cat => devCategories.value.includes(cat)))
      return false

    return ['life', 'photo', 'quote'].includes(entryKind(post))
  }

  return {
    isLife,
    entryKind,
    entryLabel,
    lifeCategories,
    devCategories,
  }
}
