import { Button, Flex, LinkBox, LinkOverlay, Stack, Text } from '@chakra-ui/react'
import { FiPlus, FiUsers } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { SurfaceCard } from '../ui/SurfaceCard.jsx'
import { AsyncContent } from '../feedback/AsyncContent.jsx'
import { EmptyState } from '../feedback/EmptyState.jsx'
import { useQuery } from '../../hooks/useQuery.js'
import { listClassrooms } from '../../services/classroom.service.js'
import { classroomGradeLabel } from '../../utils/classroom.js'
import { ROUTES } from '../../utils/constants.js'

const MAX_ITEMS = 4

/** Resumen de las aulas activas en el panel principal. */
export const DashboardClassrooms = () => {
    const classrooms = useQuery('dashboard:classrooms', () => listClassrooms({ status: 'active' }))
    return (
        <SurfaceCard
            title="Mis aulas"
            icon={FiUsers}
            actions={
                <Button as={RouterLink} to={ROUTES.classrooms} size="sm" variant="secondary">
                    Ver todas
                </Button>
            }
        >
            <AsyncContent state={classrooms} isEmpty={() => false} loadingMessage="Cargando aulas…" errorTitle="No se pudieron cargar tus aulas">
                {(list) =>
                    list.length === 0 ? (
                        <EmptyState
                            title="Aún no tienes aulas activas"
                            description="Crea un aula para registrar a tus estudiantes con un código."
                            action={
                                <Button as={RouterLink} to={ROUTES.classrooms} mt={2} size="sm" leftIcon={<FiPlus />}>
                                    Ir a mis aulas
                                </Button>
                            }
                        />
                    ) : (
                        <Stack spacing={2}>
                            {list.slice(0, MAX_ITEMS).map((classroom) => (
                                <LinkBox key={classroom.id} bg="bg.option" px={4} py={3} borderRadius="md" borderLeftWidth="4px" borderLeftColor="border.strong" _hover={{ bg: 'bg.optionHover' }}>
                                    <Flex justify="space-between" gap={3} wrap="wrap">
                                        <LinkOverlay as={RouterLink} to={ROUTES.classroomDetail(classroom.id)} fontWeight="semibold" color="text.primary">
                                            {classroom.name}
                                        </LinkOverlay>
                                        <Text fontSize="sm">{classroom.activeStudentCount ?? 0} estudiantes</Text>
                                    </Flex>
                                    <Text fontSize="sm">
                                        {classroomGradeLabel(classroom)} · Ciclo {classroom.schoolYear}
                                    </Text>
                                </LinkBox>
                            ))}
                            {list.length > MAX_ITEMS && <Text fontSize="sm">y {list.length - MAX_ITEMS} más</Text>}
                        </Stack>
                    )
                }
            </AsyncContent>
        </SurfaceCard>
    )
}
