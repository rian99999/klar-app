/** @typedef {{ key: string; label: string; undertone: 'warm' | 'cool' }} PersonalTypeDef */

/** @type {PersonalTypeDef[]} */
export const PERSONAL_TYPES = [
  { key: 'spring_warm_bright', label: '봄웜 브라이트 (비비드)', undertone: 'warm' },
  { key: 'spring_warm_light', label: '봄웜 라이트', undertone: 'warm' },
  { key: 'autumn_warm_mute', label: '가을웜 뮤트 (소프트)', undertone: 'warm' },
  { key: 'autumn_warm_deep', label: '가을웜 딥', undertone: 'warm' },
  { key: 'summer_cool_light', label: '여름쿨 라이트', undertone: 'cool' },
  { key: 'summer_cool_bright', label: '여름쿨 브라이트', undertone: 'cool' },
  { key: 'summer_cool_mute', label: '여름쿨 뮤트 (소프트)', undertone: 'cool' },
  { key: 'winter_cool_vivid', label: '겨울쿨 비비드 (브라이트)', undertone: 'cool' },
  { key: 'winter_cool_deep', label: '겨울쿨 딥 다크', undertone: 'cool' },
]

export const PERSONAL_TYPE_MAP = Object.fromEntries(
  PERSONAL_TYPES.map((t) => [t.key, t]),
)

/** 컨설팅 당일 사용 제품 카테고리 (고정) */
export const MAKEUP_DAY_CATEGORIES = [
  '립',
  '섀도우',
  '파운데이션',
  '치크',
  '쉐이딩&하이라이터',
  '아이브로우',
  '마스카라',
]

/** 예약·코스 유형 */
export const APPOINTMENT_COURSES = [
  { key: 'personal_color', label: '퍼스널컬러 진단' },
  { key: 'makeup', label: '메이크업 컨설팅' },
  { key: 'package', label: '패키지' },
  { key: 'other', label: '기타' },
]

export const APPOINTMENT_COURSE_MAP = Object.fromEntries(
  APPOINTMENT_COURSES.map((c) => [c.key, c.label]),
)

/**
 * 추천 제품 기본 카테고리.
 * 컨설팅 당일 카테고리와 항상 같은 목록이어야 해서 한 곳에서만 정의합니다.
 */
export const DEFAULT_RECOMMENDATION_CATEGORY_NAMES = MAKEUP_DAY_CATEGORIES

export const PRODUCT_CATEGORY_TABS = [
  {
    key: 'all',
    label: '전체',
    details: [],
  },
  {
    key: 'tone',
    label: '톤별',
    details: [
      { key: 'cool', label: '쿨톤' },
      { key: 'warm', label: '웜톤' },
      { key: 'neutral', label: '뉴트럴' },
      { key: 'spring', label: '봄웜' },
      { key: 'summer', label: '여름쿨' },
      { key: 'autumn', label: '가을웜' },
      { key: 'winter', label: '겨울쿨' },
    ],
  },
  {
    key: 'product_type',
    label: '제품품목별',
    details: MAKEUP_DAY_CATEGORIES.map((name) => ({
      key: name,
      label: name,
    })),
  },
  {
    key: 'brand',
    label: '브랜드별',
    details: [
      { key: 'domestic', label: '국내 브랜드' },
      { key: 'global', label: '글로벌 브랜드' },
      { key: 'roadshop', label: '로드샵' },
      { key: 'prestige', label: '백화점 / 프레스티지' },
      { key: 'indie_pro', label: '인디 / 프로 브랜드' },
      { key: 'etc_brand', label: '기타 브랜드' },
    ],
  },
]

export const PRODUCT_CATEGORY_TAB_MAP = Object.fromEntries(
  PRODUCT_CATEGORY_TABS.map((group) => [group.key, group]),
)

export const PRODUCT_CATEGORY_GROUPS = PRODUCT_CATEGORY_TABS.filter(
  (group) => group.key !== 'all',
)

export const PRODUCT_TONE_BADGE_LABELS = {
  spring_warm_bright: '봄웜브라이트',
  spring_warm_light: '봄웜라이트',
  autumn_warm_mute: '가을웜뮤트',
  autumn_warm_deep: '가을웜딥',
  summer_cool_light: '쿨섬머라이트',
  summer_cool_bright: '쿨섬머브라이트',
  summer_cool_mute: '쿨섬머뮤트',
  winter_cool_vivid: '쿨윈터비비드',
  winter_cool_deep: '쿨윈터딥',
}

export function productCategoryVisibilityKey(groupKey, detailKey = '*') {
  return `${groupKey}:${detailKey}`
}

export function createDefaultProductCategoryVisibility() {
  return Object.fromEntries(
    PRODUCT_CATEGORY_GROUPS.flatMap((group) => [
      [productCategoryVisibilityKey(group.key), true],
      ...group.details.map((detail) => [
        productCategoryVisibilityKey(group.key, detail.key),
        true,
      ]),
    ]),
  )
}
