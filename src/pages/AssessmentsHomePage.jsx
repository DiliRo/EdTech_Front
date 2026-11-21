import { Button, Flex, LinkBox, LinkOverlay, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { FiArrowRight } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { AsyncContent } from '../components/feedback/AsyncContent.jsx'
import { EmptyState } from '../components/feedback/EmptyState.jsx'
import { useQuery } from '../hooks/useQuery.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { listClassrooms } from '../services/classroom.service.js'
import { classroomGradeLabel } from '../utils/classroom.js'
import { ROUTES } from '../utils/constants.js'

/** Punto de entrada: las evaluaciones se consultan por aula. */
export const AssessmentsHomePage = () => {
    useDocumentTitle('Evaluaciones')
    const classrooms = useQuery('assessments:classrooms', () => listClassrooms({ status: 'all' }))

    return (
        <Stack spacing={6}>
            <PageHeader title="Evaluaciones" description="Elige un aula para ver sus evaluaciones, registrar calificaciones y dar seguimiento." />
            <AsyncContent state={classrooms} isEmpty={() => false} loadingMessage="Cargando aulas…" errorTitle="No se pudieron cargar tus aulas">
                {(list) =>
                    list.length === 0 ? (
                        <EmptyState
                            title="Aún no tienes aulas"
                            description="Crea un aula y registra a tus estudiantes para poder evaluarlos."
                            action={
                                <Button as={RouterLink} to={ROUTES.classrooms} mt={2} size="sm">
                                    Ir a mis aulas
                                </Button>
                            }
                        />
                    ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
                            {[...list].sort((a, b) => Number(b.isActive) - Number(a.isActive)).map((classroom) => (
                                <LinkBox
                                    key={classroom.id}
                                    bg="bg.surface"
                                    px={5}
                                    py={4}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor="border.subtle"
                                    borderLeftWidth="6px"
                                    borderLeftColor="border.strong"
                                    _hover={{ bg: 'bg.option' }}
                                >
                                    <Flex justify="space-between" align="center" gap={3}>
                                        <Stack spacing={0.5}>
                                            <LinkOverlay as={RouterLink} to={ROUTES.classroomAssessments(classroom.id)} fontWeight="bold" fontSize="lg" color="text.primary">
                                                {classroom.name}
                                            </LinkOverlay>
                                            <Text fontSize="sm">
                                                {classroomGradeLabel(classroom)} · Ciclo {classroom.schoolYear}
                                                {!classroom.isActive && ' · Archivada'}
                                            </Text>
                                        </Stack>
                                        <FiArrowRight aria-hidden />
                                    </Flex>
                                </LinkBox>
                            ))}
                        </SimpleGrid>
                    )
                }
            </AsyncContent>
        </Stack>
    )
}

export default AssessmentsHomePage
