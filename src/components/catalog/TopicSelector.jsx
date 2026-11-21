import { useMemo, useState } from 'react'
import { Button, FormControl, FormLabel, Icon, Input, InputGroup, InputLeftElement, Stack, Text } from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'
import { OptionGroup } from './OptionGroup.jsx'
import { SampleBadge } from './SampleDataNotice.jsx'
import { EmptyState } from '../feedback/EmptyState.jsx'
import { matchesSearch } from '../../utils/text.js'

/**
 * Selector de tema con búsqueda. Recibe solo los temas de la materia y el grado elegidos
 * (GET /api/topics?grade=&subject=). La búsqueda filtra en el navegador por nombre, código y
 * descripción: el backend no tiene un parámetro de búsqueda.
 */
export const TopicSelector = ({ topics, value, onChange }) => {
    const [search, setSearch] = useState('')
    const visible = useMemo(
        () => topics.filter((topic) => matchesSearch(search, [topic.name, topic.code, topic.description])),
        [topics, search]
    )
    const isFiltering = search.trim() !== ''

    return (
        <Stack spacing={4}>
            <FormControl>
                <FormLabel htmlFor="buscar-tema">Buscar tema</FormLabel>
                <InputGroup>
                    <InputLeftElement pointerEvents="none">
                        <Icon as={FiSearch} color="text.secondary" aria-hidden />
                    </InputLeftElement>
                    <Input
                        id="buscar-tema"
                        type="search"
                        placeholder="Escribe parte del nombre del tema"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        autoComplete="off"
                    />
                </InputGroup>
            </FormControl>

            <Text fontSize="sm" aria-live="polite">
                {isFiltering ? `${visible.length} de ${topics.length} temas coinciden` : `${topics.length} ${topics.length === 1 ? 'tema' : 'temas'}`}
            </Text>

            {visible.length === 0 ? (
                <EmptyState
                    icon={FiSearch}
                    title="Ningún tema coincide con tu búsqueda"
                    description={`No encontramos temas con "${search.trim()}". Revisa la escritura o prueba con otra palabra.`}
                    action={
                        <Button size="sm" mt={2} onClick={() => setSearch('')}>
                            Limpiar búsqueda
                        </Button>
                    }
                />
            ) : (
                <OptionGroup
                    name="tema"
                    label="Temas de la materia"
                    options={visible}
                    value={value}
                    onChange={onChange}
                    spacing={2}
                    renderOption={(topic) => (
                        <>
                            <Text as="span" display="block" fontWeight="semibold" color="text.primary">
                                {topic.name}
                                {topic.isSample && <SampleBadge />}
                            </Text>
                            {topic.description && (
                                <Text as="span" display="block" mt={1} fontSize="sm" color="text.secondary" noOfLines={2}>
                                    {topic.description}
                                </Text>
                            )}
                        </>
                    )}
                />
            )}
        </Stack>
    )
}
