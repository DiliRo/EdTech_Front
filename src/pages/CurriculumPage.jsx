import { useEffect, useRef } from 'react'
import { Box, Button, Grid, Stack, Text } from '@chakra-ui/react'
import { FiBook, FiFileText, FiLayers, FiList } from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { SurfaceCard } from '../components/ui/SurfaceCard.jsx'
import { AsyncContent } from '../components/feedback/AsyncContent.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { GradeSelector } from '../components/catalog/GradeSelector.jsx'
import { SubjectSelector } from '../components/catalog/SubjectSelector.jsx'
import { TopicSelector } from '../components/catalog/TopicSelector.jsx'
import { TopicDetail } from '../components/catalog/TopicDetail.jsx'
import { SampleDataNotice } from '../components/catalog/SampleDataNotice.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { getAllTopics, getGrades, getSubjects, getTopic } from '../services/catalog.service.js'
import { CATALOG_PARAMS } from '../utils/catalog.js'


const Step = ({ number, children }) => (
    <Text as="span">
        <Text as="span" srOnly>
            Paso {number}:{' '}
        </Text>
        {children}
    </Text>
)

/**
 * Selección académica: grado → materia → tema → contenido curricular del tema.
 * Cada paso consulta el backend B3 solo con la selección anterior, así solo aparecen las materias
 * del grado y los temas de esa materia en ese grado.
 */
export const CurriculumPage = () => {
    useDocumentTitle('Currículo')
    const [params, setParams] = useSearchParams()
    const detailRef = useRef(null)

    // 1. Grados (los ids de la URL solo cuentan si existen en lo que devolvió el backend)
    const grades = useQuery('grades', () => getGrades())
    const grade = grades.data?.find((item) => item.id === params.get(CATALOG_PARAMS.grade)) ?? null

    // 2. Materias del grado
    const subjects = useQuery(grade?.id ?? null, () => getSubjects({ grade: grade.id }))
    const subject = subjects.data?.subjects.find((item) => item.id === params.get(CATALOG_PARAMS.subject)) ?? null

    // 3. Temas de la materia en el grado
    const topicsKey = grade && subject ? `${grade.id}:${subject.id}` : null
    const topics = useQuery(topicsKey, () => getAllTopics({ grade: grade.id, subject: subject.id }))
    const topic = topics.data?.topics.find((item) => item.id === params.get(CATALOG_PARAMS.topic)) ?? null

    // 4. Detalle del tema elegido
    const detail = useQuery(topic?.id ?? null, () => getTopic(topic.id))

    const select = (next) => setParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))
    const selectGrade = (id) => select({ [CATALOG_PARAMS.grade]: id })
    const selectSubject = (id) => select({ [CATALOG_PARAMS.grade]: grade.id, [CATALOG_PARAMS.subject]: id })
    const selectTopic = (id) => select({ [CATALOG_PARAMS.grade]: grade.id, [CATALOG_PARAMS.subject]: subject.id, [CATALOG_PARAMS.topic]: id })

    // En pantallas pequeñas el detalle queda debajo: se lleva la vista hasta él al elegir un tema
    const topicId = topic?.id
    useEffect(() => {
        if (!topicId || typeof window.matchMedia !== 'function') return
        if (window.matchMedia('(max-width: 79.99em)').matches) {
            detailRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
        }
    }, [topicId])

    return (
        <Stack spacing={6}>
            <PageHeader
                title="Currículo"
                description="Elige un grado, una materia y un tema para consultar su descripción, competencias e indicadores de logro."
            />

            <SurfaceCard
                title={<Step number={1}>Grado</Step>}
                icon={FiLayers}
                actions={
                    grade && (
                        <Button size="sm" variant="secondary" onClick={() => setParams({})}>
                            Limpiar selección
                        </Button>
                    )
                }
            >
                <AsyncContent
                    state={grades}
                    loadingMessage="Cargando grados…"
                    errorTitle="No se pudieron cargar los grados"
                    emptyTitle="El catálogo curricular aún no está disponible"
                    emptyDescription="Todavía no se han cargado los grados de primaria en la plataforma."
                >
                    {(list) => <GradeSelector grades={list} value={grade?.id} onChange={selectGrade} />}
                </AsyncContent>
            </SurfaceCard>

            {grade && (
                <Grid templateColumns={{ base: 'minmax(0, 1fr)', xl: 'minmax(0, 5fr) minmax(0, 7fr)' }} gap={6} alignItems="start">
                    <Stack spacing={6}>
                        <SurfaceCard title={<Step number={2}>Materia</Step>} icon={FiBook} description={`Materias de ${grade.name}.`}>
                            <AsyncContent
                                state={subjects}
                                isEmpty={(data) => !data?.subjects.length}
                                loadingMessage="Cargando materias…"
                                errorTitle="No se pudieron cargar las materias"
                                emptyTitle={`No hay materias registradas para ${grade.name}`}
                                emptyDescription="El catálogo curricular todavía no incluye materias para este grado."
                            >
                                {(data) => (
                                    <Stack spacing={4}>
                                        {data.containsSampleData && <SampleDataNotice>Algunas materias son de prueba: no provienen del CNB.</SampleDataNotice>}
                                        <SubjectSelector subjects={data.subjects} value={subject?.id} onChange={selectSubject} />
                                    </Stack>
                                )}
                            </AsyncContent>
                        </SurfaceCard>

                        {subject && (
                            <SurfaceCard title={<Step number={3}>Tema</Step>} icon={FiList} description={`${subject.name} · ${grade.name}`}>
                                <AsyncContent
                                    state={topics}
                                    isEmpty={(data) => !data?.topics.length}
                                    loadingMessage="Cargando temas…"
                                    errorTitle="No se pudieron cargar los temas"
                                    emptyTitle="No hay temas registrados"
                                    emptyDescription={`El catálogo curricular todavía no incluye temas de ${subject.name} para ${grade.name}.`}
                                >
                                    {(data) => (
                                        <Stack spacing={4}>
                                            {data.isTruncated && (
                                                <Text fontSize="sm">
                                                    Se muestran los primeros {data.topics.length} de {data.total} temas.
                                                </Text>
                                            )}
                                            {/* key: la búsqueda empieza vacía al cambiar de materia */}
                                            <TopicSelector key={topicsKey} topics={data.topics} value={topic?.id} onChange={selectTopic} />
                                        </Stack>
                                    )}
                                </AsyncContent>
                            </SurfaceCard>
                        )}
                    </Stack>

                    <Box ref={detailRef} position={{ xl: 'sticky' }} top={{ xl: '88px' }} scrollMarginTop="88px">
                        <SurfaceCard title="Contenido del tema" icon={FiFileText}>
                            {!topic ? (
                                <EmptyState
                                    icon={FiFileText}
                                    title={subject ? 'Selecciona un tema' : 'Selecciona una materia y un tema'}
                                    description="Aquí verás la descripción, las competencias y los indicadores de logro del tema."
                                />
                            ) : (
                                <AsyncContent
                                    state={detail}
                                    loadingMessage="Cargando contenido del tema…"
                                    errorTitle="No se pudo cargar el contenido del tema"
                                >
                                    {(data) => <TopicDetail topic={data.topic} containsSampleData={data.containsSampleData} />}
                                </AsyncContent>
                            )}
                        </SurfaceCard>
                    </Box>
                </Grid>
            )}
        </Stack>
    )
}

export default CurriculumPage
