import { useMemo, useState } from 'react'
import { Button, Flex, Link, Stack, Text } from '@chakra-ui/react'
import { FiArchive, FiArrowLeft, FiEdit2, FiInfo, FiRotateCcw, FiSearch, FiUserPlus, FiUsers } from 'react-icons/fi'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { FormAlert } from '../components/ui/FormAlert.jsx'
import { AsyncContent } from '../components/feedback/AsyncContent.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { LoadingState } from '../components/feedback/LoadingState.jsx'
import { ErrorState } from '../components/feedback/ErrorState.jsx'
import { SearchInput } from '../components/common/SearchInput.jsx'
import { SegmentedControl } from '../components/common/SegmentedControl.jsx'
import { Pagination } from '../components/common/Pagination.jsx'
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx'
import { ClassroomInfo } from '../components/classrooms/ClassroomInfo.jsx'
import { ClassroomFormModal } from '../components/classrooms/ClassroomFormModal.jsx'
import { StudentTable } from '../components/classrooms/StudentTable.jsx'
import { StudentFormModal } from '../components/classrooms/StudentFormModal.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { usePagination } from '../hooks/usePagination.js'
import { useNotify } from '../hooks/useNotify.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { archiveClassroom, getClassroom, restoreClassroom } from '../services/classroom.service.js'
import { listStudents, reinstateStudent, withdrawStudent } from '../services/student.service.js'
import { normalizeApiError } from '../utils/apiError.js'
import { matchesSearch } from '../utils/text.js'
import { PAGE_SIZES, STATUS_OPTIONS, classroomGradeLabel } from '../utils/classroom.js'
import { ROUTES } from '../utils/constants.js'

const BackLink = () => (
    <Link as={RouterLink} to={ROUTES.classrooms} display="inline-flex" alignItems="center" gap={1} fontWeight="semibold">
        <FiArrowLeft aria-hidden /> Volver a mis aulas
    </Link>
)

const STUDENTS_EMPTY = {
    active: 'Esta aula aún no tiene estudiantes activos',
    archived: 'No hay estudiantes retirados',
    all: 'Esta aula aún no tiene estudiantes'
}

/** Estudiantes del aula: filtro por estado, búsqueda por código, paginación y acciones. */
const StudentsSection = ({ classroom, onChanged }) => {
    const notify = useNotify()
    const [status, setStatus] = useState('active')
    const [search, setSearch] = useState('')
    const [formTarget, setFormTarget] = useState(null) // null | { student: null | object }
    const [withdrawTarget, setWithdrawTarget] = useState(null)
    const students = useQuery(`${classroom.id}:${status}`, () => listStudents(classroom.id, { status }))

    const all = useMemo(() => students.data ?? [], [students.data])
    const filtered = useMemo(() => all.filter((s) => matchesSearch(search, [s.studentCode])), [all, search])
    const pagination = usePagination(filtered, PAGE_SIZES.students)

    const refresh = () => {
        students.run()
        onChanged() // actualiza el conteo de estudiantes activos del aula
    }

    const handleSaved = (student, { keepOpen }) => {
        const isEdit = Boolean(formTarget?.student)
        if (!keepOpen) {
            setFormTarget(null)
            notify(isEdit ? `El código se cambió a ${student.studentCode}.` : `Se agregó al estudiante ${student.studentCode}.`)
        }
        refresh()
    }

    const handleWithdraw = async () => {
        const student = await withdrawStudent(withdrawTarget.id)
        notify(`Se retiró al estudiante ${student.studentCode}.`)
        refresh()
    }

    const handleReinstate = async (student) => {
        try {
            await reinstateStudent(student.id)
            notify(`Se reincorporó al estudiante ${student.studentCode}.`)
            refresh()
        } catch (error) {
            notify(`No se pudo reincorporar: ${normalizeApiError(error).message}`, 'error')
        }
    }

    const addButton = classroom.isActive && (
        <Button size="sm" leftIcon={<FiUserPlus />} onClick={() => setFormTarget({ student: null })}>
            Agregar estudiante
        </Button>
    )

    return (
        <SurfaceCard title="Estudiantes" icon={FiUsers} actions={addButton}>
            <Stack spacing={5}>
                <Flex direction={{ base: 'column', md: 'row' }} gap={4} align={{ md: 'flex-end' }}>
                    <SegmentedControl
                        name="estado-estudiantes"
                        label="Estado"
                        options={STATUS_OPTIONS.students}
                        value={status}
                        onChange={(value) => {
                            setStatus(value)
                            pagination.setPage(1)
                        }}
                    />
                    <SearchInput
                        id="buscar-estudiante"
                        label="Buscar por código"
                        value={search}
                        onChange={(value) => {
                            setSearch(value)
                            pagination.setPage(1)
                        }}
                        placeholder="Ej.: A01"
                        maxW={{ md: '320px' }}
                    />
                </Flex>

                <AsyncContent state={students} isEmpty={() => false} loadingMessage="Cargando estudiantes…" errorTitle="No se pudieron cargar los estudiantes">
                    {() =>
                        all.length === 0 ? (
                            <EmptyState
                                icon={FiUsers}
                                title={STUDENTS_EMPTY[status]}
                                description={
                                    status === 'archived'
                                        ? 'Los estudiantes que retires aparecerán aquí y podrás reincorporarlos.'
                                        : classroom.isActive
                                          ? 'Agrega a cada estudiante con el código que tú le asignes (por ejemplo A01). No se piden nombres ni datos personales.'
                                          : 'Restaura el aula para agregar estudiantes.'
                                }
                                action={status !== 'archived' && addButton}
                            />
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                icon={FiSearch}
                                title="Ningún código coincide con tu búsqueda"
                                description={`No hay estudiantes con "${search.trim()}" en su código.`}
                                action={
                                    <Button mt={2} size="sm" onClick={() => setSearch('')}>
                                        Limpiar búsqueda
                                    </Button>
                                }
                            />
                        ) : (
                            <Stack spacing={4}>
                                <StudentTable
                                    students={pagination.pageItems}
                                    onEdit={(student) => setFormTarget({ student })}
                                    onWithdraw={setWithdrawTarget}
                                    onReinstate={handleReinstate}
                                    canReinstate={classroom.isActive}
                                />
                                <Pagination {...pagination} onChange={pagination.setPage} itemLabel="estudiantes" />
                            </Stack>
                        )
                    }
                </AsyncContent>
            </Stack>

            <StudentFormModal
                isOpen={Boolean(formTarget)}
                classroomId={classroom.id}
                student={formTarget?.student}
                onClose={() => setFormTarget(null)}
                onSaved={handleSaved}
            />

            <ConfirmDialog
                isOpen={Boolean(withdrawTarget)}
                onClose={() => setWithdrawTarget(null)}
                onConfirm={handleWithdraw}
                title="¿Retirar a este estudiante?"
                confirmLabel="Retirar estudiante"
                loadingText="Retirando…"
            >
                <Text>
                    El estudiante <strong>{withdrawTarget?.studentCode}</strong> dejará de aparecer entre los activos de esta aula.
                </Text>
                <Text>No se borra: su historial se conserva y puedes reincorporarlo después. Su código no se puede asignar a otro estudiante de esta aula.</Text>
            </ConfirmDialog>
        </SurfaceCard>
    )
}

/** Detalle de un aula: información general y estudiantes. */
export const ClassroomDetailPage = () => {
    const { classroomId } = useParams()
    const notify = useNotify()
    const classroom = useQuery(classroomId, () => getClassroom(classroomId))
    const [isEditing, setEditing] = useState(false)
    const [isArchiving, setArchiving] = useState(false)
    const [isRestoring, setRestoring] = useState(false)
    useDocumentTitle(classroom.data?.name ?? 'Aula')

    if (classroom.isLoading) return <LoadingState message="Cargando aula…" />

    if (classroom.isError) {
        // 404: no existe o es de otro docente (el backend no distingue, a propósito)
        if (classroom.error?.status === 404) {
            return (
                <Stack spacing={4}>
                    <BackLink />
                    <EmptyState
                        title="Aula no encontrada"
                        description="Esta aula no existe o no pertenece a tu cuenta."
                        action={
                            <Button as={RouterLink} to={ROUTES.classrooms} mt={2}>
                                Ver mis aulas
                            </Button>
                        }
                    />
                </Stack>
            )
        }
        return (
            <Stack spacing={4}>
                <BackLink />
                <ErrorState title="No se pudo cargar el aula" error={classroom.error} onRetry={classroom.run} />
            </Stack>
        )
    }

    const data = classroom.data
    if (!data) return null

    const handleRestore = async () => {
        setRestoring(true)
        try {
            await restoreClassroom(data.id)
            notify(`Se restauró el aula "${data.name}".`)
            classroom.run()
        } catch (error) {
            notify(`No se pudo restaurar el aula: ${normalizeApiError(error).message}`, 'error')
        } finally {
            setRestoring(false)
        }
    }

    return (
        <Stack spacing={6}>
            <BackLink />
            <PageHeader
                title={data.name}
                description={`${classroomGradeLabel(data)} · Ciclo ${data.schoolYear}`}
                actions={
                    data.isActive ? (
                        <>
                            <Button variant="secondary" leftIcon={<FiEdit2 />} onClick={() => setEditing(true)}>
                                Editar aula
                            </Button>
                            <Button variant="ghost" leftIcon={<FiArchive />} onClick={() => setArchiving(true)}>
                                Archivar
                            </Button>
                        </>
                    ) : (
                        <Button leftIcon={<FiRotateCcw />} onClick={handleRestore} isLoading={isRestoring} loadingText="Restaurando…">
                            Restaurar aula
                        </Button>
                    )
                }
            />

            {!data.isActive && (
                <FormAlert status="warning">Esta aula está archivada. Restáurala para editarla o agregar estudiantes.</FormAlert>
            )}

            <SurfaceCard title="Información general" icon={FiInfo}>
                <ClassroomInfo classroom={data} />
            </SurfaceCard>

            <StudentsSection classroom={data} onChanged={classroom.run} />

            <ClassroomFormModal
                isOpen={isEditing}
                classroom={data}
                onClose={() => setEditing(false)}
                onSaved={(saved) => {
                    setEditing(false)
                    notify(`Se guardaron los cambios de "${saved.name}".`)
                    classroom.run()
                }}
            />

            <ConfirmDialog
                isOpen={isArchiving}
                onClose={() => setArchiving(false)}
                onConfirm={async () => {
                    await archiveClassroom(data.id)
                    notify(`Se archivó el aula "${data.name}".`)
                    classroom.run()
                }}
                title="¿Archivar esta aula?"
                confirmLabel="Archivar aula"
                loadingText="Archivando…"
            >
                <Text>
                    <strong>{data.name}</strong> dejará de aparecer entre tus aulas activas y no podrás agregar estudiantes mientras esté archivada.
                </Text>
                <Text>No se borra nada: los estudiantes y su historial se conservan y puedes restaurarla después.</Text>
            </ConfirmDialog>
        </Stack>
    )
}

export default ClassroomDetailPage
