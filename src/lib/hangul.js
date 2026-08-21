const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

/** Merges the tense consonants into their base so groups stay readable. */
const CHOSEONG_GROUP = {
  ㄲ: 'ㄱ',
  ㄸ: 'ㄷ',
  ㅃ: 'ㅂ',
  ㅆ: 'ㅅ',
  ㅉ: 'ㅈ',
}

/** Initial-consonant bucket for a name, used to index the customer list. */
export function initialLetter(name) {
  const first = String(name ?? '').trim().charAt(0)
  if (!first) return '#'
  const code = first.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const letter = CHOSEONG[Math.floor((code - 0xac00) / 588)]
    return CHOSEONG_GROUP[letter] ?? letter
  }
  if (/[a-zA-Z]/.test(first)) return first.toUpperCase()
  return '#'
}

/** Groups a pre-sorted list of customers into `{ letter, items }` sections. */
export function groupByInitial(items, getName = (item) => item.name) {
  const groups = []
  items.forEach((item) => {
    const letter = initialLetter(getName(item))
    const last = groups[groups.length - 1]
    if (last && last.letter === letter) last.items.push(item)
    else groups.push({ letter, items: [item] })
  })
  return groups
}
