import { Box, Button, Checkbox, CheckboxGroup, Flex, FormControl, FormHelperText, FormLabel, Select, SimpleGrid, Stack, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { SegmentedControl } from '../common/SegmentedControl.jsx'
import { useQuery } from '../../hooks/useQuery.js'
import { getGrades, getSubjects } from '../../services/catalog.service.js'
import { DURATION_FILTER_OPTIONS, SCOPE_OPTIONS } from '../../utils/methodology.js'

/**
 * Filtros del listado. Todos se aplican en el backend (B5):
 * tipo (scope), grado, materia, tiempo disponible (maxDuration) y preferencias (learningPreferences).
 */
export const MethodologyFilters = ({ filters, onChange, onClear, preferences }) => {
    const grades = useQuery('grades', () => getGrades())
    // Con grado: materias de ese grado; sin grado: todas las del catálogo
    const subjects = useQuery(`subjects:${filters.grade || 'all'}`, () => getSubjects(filters.grade ? { grade: filters.grade } : {}))
    const hasFilters = Boolean(filters.grade || filters.subject || filters.maxDuration || filters.learningPreferences.length || filters.scope !== 'all')

    return (
        <Stack spacing={5}>
            <SegmentedControl name="tipo-metodologia" label="Tipo" options={SCOPE_OPTIONS} value={filters.scope} onChange={(scope) => onChange({ scope })} />

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <FormControl>
                    <FormLabel htmlFor="filtro-grado">Grado</FormLabel>
                    <Select id="filtro-grado" value={filters.grade} onChange={(e) => onChange({ grade: e.target.value, subject: '' })} isDisabled={grades.isLoading}>
                        <option value="">Todos los grados</option>
                        {(grades.data ?? []).map((grade) => (
                            <option key={grade.id} value={grade.id}>
                                {grade.name}
                            </option>
                        ))}
                    </Select>
                    {grades.isError && <FormHelperText color="status.error">No se pudieron cargar los grados.</FormHelperText>}
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="filtro-materia">Materia</FormLabel>
                    <Select id="filtro-materia" value={filters.subject} onChange={(e) => onChange({ subject: e.target.value })} isDisabled={subjects.isLoading}>
                        <option value="">Todas las materias</option>
                        {(subjects.data?.subjects ?? []).map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </Select>
                    {subjects.isError && <FormHelperText color="status.error">No se pudieron cargar las materias.</FormHelperText>}
                </FormControl>
                <FormControl>
                    <FormLabel htmlFor="filtro-duracion">Tiempo disponible</FormLabel>
                    <Select id="filtro-duracion" value={filters.maxDuration} onChange={(e) => onChange({ maxDuration: e.target.value })}>
                        <option value="">Cualquier duración</option>
                        {DURATION_FILTER_OPTIONS.map((minutes) => (
                            <option key={minutes} value={String(minutes)}>
                                Hasta {minutes} minutos
                            </option>
                        ))}
                    </Select>
                    {filters.maxDuration && <FormHelperText fontSize="xs">No incluye metodologías sin duración indicada.</FormHelperText>}
                </FormControl>
            </SimpleGrid>

            {preferences.length > 0 && (
                <Box as="fieldset">
                    <Text as="legend" fontWeight="semibold" color="text.primary" mb={1}>
                        Preferencias de aprendizaje que puede favorecer
                    </Text>
                    <Text fontSize="sm" mb={3}>
                        Son descriptivas: ayudan a variar la participación, pero no determinan el rendimiento de nadie.
                    </Text>
                    <CheckboxGroup value={filters.learningPreferences} onChange={(codes) => onChange({ learningPreferences: codes })}>
                        <Wrap spacing={4}>
                            {preferences.map((pref) => (
                                <WrapItem key={pref.code}>
                                    <Checkbox value={pref.code}>{pref.label}</Checkbox>
                                </WrapItem>
                            ))}
                        </Wrap>
                    </CheckboxGroup>
                </Box>
            )}

            {hasFilters && (
                <Flex>
                    <Button size="sm" variant="ghost" onClick={onClear}>
                        Limpiar filtros
                    </Button>
                </Flex>
            )}
        </Stack>
    )
}
