/** Parámetros de la URL de /curriculo: la selección se puede compartir, recargar y deshacer con "Atrás". */
export const CATALOG_PARAMS = Object.freeze({ grade: 'grado', subject: 'materia', topic: 'tema' })

/** Ordinal corto para el número de grado: 1 → "1.º". */
export const gradeOrdinal = (number) => `${number}.º`
