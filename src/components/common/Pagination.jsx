import { Button, Flex, HStack, IconButton, Text } from '@chakra-ui/react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

/** Números de página a mostrar: primera, última y vecinas de la actual, con "…" entre saltos. */
const pageList = (page, totalPages) => {
    const pages = new Set([1, totalPages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= totalPages))
    const sorted = [...pages].sort((a, b) => a - b)
    return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['…', p] : [p]))
}

/**
 * Controles de paginación con resumen "Mostrando 1–20 de 45 estudiantes".
 * Recibe el resultado de usePagination.
 */
export const Pagination = ({ page, totalPages, total, from, to, onChange, itemLabel = 'elementos' }) => {
    if (!total) return null
    return (
        <Flex as="nav" aria-label="Paginación" direction={{ base: 'column', sm: 'row' }} align="center" justify="space-between" gap={3}>
            <Text fontSize="sm" aria-live="polite">
                Mostrando {from}–{to} de {total} {itemLabel}
            </Text>
            {totalPages > 1 && (
                <HStack spacing={1}>
                    <IconButton
                        size="sm"
                        variant="secondary"
                        aria-label="Página anterior"
                        icon={<FiChevronLeft />}
                        onClick={() => onChange(page - 1)}
                        isDisabled={page <= 1}
                    />
                    {pageList(page, totalPages).map((item, index) =>
                        item === '…' ? (
                            <Text key={`gap-${index}`} px={1} aria-hidden>
                                …
                            </Text>
                        ) : (
                            <Button
                                key={item}
                                size="sm"
                                variant={item === page ? 'primary' : 'ghost'}
                                aria-label={`Página ${item}`}
                                aria-current={item === page ? 'page' : undefined}
                                onClick={() => onChange(item)}
                                minW={9}
                            >
                                {item}
                            </Button>
                        )
                    )}
                    <IconButton
                        size="sm"
                        variant="secondary"
                        aria-label="Página siguiente"
                        icon={<FiChevronRight />}
                        onClick={() => onChange(page + 1)}
                        isDisabled={page >= totalPages}
                    />
                </HStack>
            )}
        </Flex>
    )
}
