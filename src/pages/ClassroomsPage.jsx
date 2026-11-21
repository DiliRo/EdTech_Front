import { useMemo, useState } from 'react'
import { Button, Flex, FormControl, FormLabel, Select, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { FiArchive, FiPlus, FiSearch, FiUsers } from 'react-icons/fi'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { AsyncContent } from '../components/feedback/AsyncContent.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { SearchInput } from '../components/common/SearchInput.jsx'
import { SegmentedControl } from '../components/common/SegmentedControl.jsx'
import { Pagination } from '../components/common/Pagination.jsx'
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx'
import { ClassroomCard } from '../components/classrooms/ClassroomCard.jsx'
import { ClassroomFormModal } from '../components/classrooms/ClassroomFormModal.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { usePagination } from '../hooks/usePagination.js'
import { useNotify } from '../hooks/useNotify.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { archiveClassroom, listClassrooms, restoreClassroom } from '../services/classroom.service.js'
import { normalizeApiError } from '../utils/apiError.js'
import { matchesSearch } from '../utils/text.js'
import { PAGE_SIZES, STATUS_OPTIONS, classroomGradeLabel } from '../utils/classroom.js'

const EMPTY_BY_STATUS = {
    active: { title: 'Aún no tienes aulas activas', description: 'Crea tu primera aula para registrar a tus estudiantes con un código.' },
    archived: { title: 'No tienes aulas archivadas', description: 'Las aulas que archives aparecerán aquí y podrás restaurarlas.' },
    all: { title: 'Aún no tienes aulas', description: 'Crea tu primera aula para registrar a tus estudiantes con un código.' }
}

/** Listado de las aulas del docente: filtros, búsqueda, paginación y acciones. */
export const ClassroomsPage = () => {
    useDocumentTitle('Mis aulas')
    const notify = useNotify()
    const [status, setStatus] = useState('active')
    const [search, setSearch] = useState('')
    const [schoolYear, setSchoolYear] = useState('')
    const [formTarget, setFormTarget] = useState(null) // null | { classroom: null | object }
    const [archiveTarget, setArchiveTarget] = useState(null)

    const classrooms = useQuery(`classrooms:${status}`, () => listClassrooms({ status }))
    const all = useMemo(() => classrooms.data ?? [], [classrooms.data])

    const years = useMemo(() => [...new Set(all.map((c) => c.schoolYear))].sort((a, b) => b - a), [all])
    const filtered = useMemo(
        () =>
            all.filter(
                (c) =>
                    (!schoolYear || String(c.schoolYear) === schoolYear) &&
                    matchesSearch(search, [c.name, c.section, c.grade?.name, ...(c.subjects ?? []).map((s) => s.name)])
            ),
        [all, search, schoolYear]
    )
    const pagination = usePagination(filtered, PAGE_SIZES.classrooms)
    const isFiltering = search.trim() !== '' || schoolYear !== ''

    const changeFilter = (setter) => (value) => {
        setter(value)
        pagination.setPage(1)
    }

    const handleSaved = (classroom) => {
        notify(formTarget?.classroom ? `Se guardaron los cambios de "${classroom.name}".` : `Se creó el aula "${classroom.name}".`)
        setFormTarget(null)
        classrooms.run()
    }

    const handleArchive = async () => {
        const classroom = await archiveClassroom(archiveTarget.id)
        notify(`Se archivó el aula "${classroom.name}".`)
        classrooms.run()
    }

    const handleRestore = async (classroom) => {
        try {
            await restoreClassroom(classroom.id)
            notify(`Se restauró el aula "${classroom.name}".`)
            classrooms.run()
        } catch (error) {
            notify(`No se pudo restaurar el aula: ${normalizeApiError(error).message}`, 'error')
        }
    }

    const openCreate = () => setFormTarget({ classroom: null })

    return (
        <Stack spacing={6}>
            <PageHeader
                title="Mis aulas"
                description="Administra tus aulas y registra a tus estudiantes con un código."
                actions={
                    <Button leftIcon={<FiPlus />} onClick={openCreate}>
                        Nueva aula
                    </Button>
                }
            />

            <SurfaceCard>
                <Flex direction={{ base: 'column', lg: 'row' }} gap={4} align={{ lg: 'flex-end' }}>
                    <SegmentedControl name="estado-aulas" label="Estado" options={STATUS_OPTIONS.classrooms} value={status} onChange={changeFilter(setStatus)} />
                    <SearchInput id="buscar-aula" label="Buscar aula" value={search} onChange={changeFilter(setSearch)} placeholder="Nombre, grado, sección o materia" />
                    <FormControl maxW={{ lg: '200px' }}>
                        <FormLabel htmlFor="ciclo-aulas">Ciclo escolar</FormLabel>
                        <Select id="ciclo-aulas" value={schoolYear} onChange={(e) => changeFilter(setSchoolYear)(e.target.value)}>
                            <option value="">Todos los ciclos</option>
                            {years.map((year) => (
                                <option key={year} value={String(year)}>
                                    {year}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                </Flex>
            </SurfaceCard>

            <AsyncContent
                state={classrooms}
                isEmpty={() => false}
                loadingMessage="Cargando aulas…"
                errorTitle="No se pudieron cargar tus aulas"
            >
                {() =>
                    all.length === 0 ? (
                        <EmptyState
                            icon={status === 'archived' ? FiArchive : FiUsers}
                            title={EMPTY_BY_STATUS[status].title}
                            description={EMPTY_BY_STATUS[status].description}
                            action={
                                status !== 'archived' && (
                                    <Button mt={2} leftIcon={<FiPlus />} onClick={openCreate}>
                                        Crear aula
                                    </Button>
                                )
                            }
                        />
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            icon={FiSearch}
                            title="Ninguna aula coincide con tu búsqueda"
                            description="Revisa la escritura o cambia los filtros."
                            action={
                                isFiltering && (
                                    <Button
                                        mt={2}
                                        size="sm"
                                        onClick={() => {
                                            setSearch('')
                                            setSchoolYear('')
                                            pagination.setPage(1)
                                        }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                )
                            }
                        />
                    ) : (
                        <Stack spacing={5}>
                            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
                                {pagination.pageItems.map((classroom) => (
                                    <ClassroomCard
                                        key={classroom.id}
                                        classroom={classroom}
                                        onEdit={(c) => setFormTarget({ classroom: c })}
                                        onArchive={setArchiveTarget}
                                        onRestore={handleRestore}
                                    />
                                ))}
                            </SimpleGrid>
                            <Pagination {...pagination} onChange={pagination.setPage} itemLabel="aulas" />
                        </Stack>
                    )
                }
            </AsyncContent>

            <ClassroomFormModal isOpen={Boolean(formTarget)} classroom={formTarget?.classroom} onClose={() => setFormTarget(null)} onSaved={handleSaved} />

            <ConfirmDialog
                isOpen={Boolean(archiveTarget)}
                onClose={() => setArchiveTarget(null)}
                onConfirm={handleArchive}
                title="¿Archivar esta aula?"
                confirmLabel="Archivar aula"
                loadingText="Archivando…"
            >
                <Text>
                    <strong>{archiveTarget?.name}</strong> ({classroomGradeLabel(archiveTarget)}) dejará de aparecer entre tus aulas activas.
                </Text>
                <Text>No se borra nada: los estudiantes y su historial se conservan y puedes restaurarla después.</Text>
            </ConfirmDialog>
        </Stack>
    )
}

export default ClassroomsPage
