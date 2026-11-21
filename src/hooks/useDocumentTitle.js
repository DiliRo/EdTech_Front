import { useEffect } from 'react'
import { APP_NAME } from '../utils/constants.js'

/** Título de la pestaña del navegador: "Página · Etamanïk". */
export const useDocumentTitle = (title) => {
    useEffect(() => {
        document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
    }, [title])
}
