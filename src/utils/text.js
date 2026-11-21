/** Minúsculas y sin tildes, para buscar "fraccion" y encontrar "Fracciones". */
export const normalizeText = (value) =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()

/** true si todas las palabras de la búsqueda aparecen en alguno de los textos. */
export const matchesSearch = (search, texts) => {
    const words = normalizeText(search).split(/\s+/).filter(Boolean)
    if (!words.length) return true
    const haystack = texts.map(normalizeText).join(' ')
    return words.every((word) => haystack.includes(word))
}
