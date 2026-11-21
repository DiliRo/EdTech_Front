/**
 * Convierte cualquier error de Axios en un objeto uniforme para la interfaz.
 *
 * El backend responde los errores como:
 *   { success: false, message: "...", errors: [{ field: "email", message: "..." }] }
 * Este formato no se modifica aquí: solo se lee.
 *
 * @returns {{ status: number|null, message: string, fieldErrors: Record<string,string>,
 *             isNetworkError: boolean, isTimeout: boolean }}
 */
export const normalizeApiError = (error) => {
    if (error?.isApiError) return error

    const response = error?.response
    const isTimeout = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
    const isNetworkError = !response && !isTimeout

    const fieldErrors = {}
    for (const item of response?.data?.errors ?? []) {
        if (item?.field && !fieldErrors[item.field]) fieldErrors[item.field] = item.message
    }

    let message = response?.data?.message
    if (!message) {
        if (isTimeout) message = 'El servidor tardó demasiado en responder. Intenta de nuevo.'
        else if (isNetworkError) message = 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
        else message = 'Ocurrió un error inesperado. Intenta de nuevo.'
    }

    return {
        isApiError: true,
        status: response?.status ?? null,
        message,
        fieldErrors,
        isNetworkError,
        isTimeout
    }
}
