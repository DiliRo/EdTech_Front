import { LoadingState } from './LoadingState.jsx'
import { ErrorState } from './ErrorState.jsx'
import { EmptyState } from './EmptyState.jsx'

/**
 * Muestra el estado correcto de una carga: cargando, error, sin datos o el contenido.
 *
 * @param {object} props
 * @param {{ status: string, data: any, error: any, run?: Function }} props.state  resultado de useAsync
 * @param {(data: any) => boolean} [props.isEmpty]
 * @param {(data: any) => import('react').ReactNode} props.children
 */
export const AsyncContent = ({
    state,
    isEmpty = (data) => data == null || (Array.isArray(data) && data.length === 0),
    loadingMessage,
    errorTitle,
    emptyTitle,
    emptyDescription,
    children
}) => {
    if (state.status === 'idle' || state.status === 'loading') return <LoadingState message={loadingMessage} />
    if (state.status === 'error') return <ErrorState error={state.error} title={errorTitle} onRetry={state.run ? () => state.run() : undefined} />
    if (isEmpty(state.data)) return <EmptyState title={emptyTitle} description={emptyDescription} />
    return children(state.data)
}
