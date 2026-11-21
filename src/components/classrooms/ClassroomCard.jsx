import { Badge, Button, Card, CardBody, CardFooter, Flex, Heading, Icon, LinkBox, LinkOverlay, Stack, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { FiArchive, FiCalendar, FiEdit2, FiRotateCcw, FiUsers } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { ROUTES } from '../../utils/constants.js'
import { classroomGradeLabel } from '../../utils/classroom.js'

export const ClassroomStatusBadge = ({ isActive }) =>
    isActive ? (
        <Badge bg="status.successBg" color="status.success" borderWidth="1px" borderColor="status.success">
            Activa
        </Badge>
    ) : (
        <Badge bg="status.warningBg" color="status.warning" borderWidth="1px" borderColor="status.warning">
            Archivada
        </Badge>
    )

const MAX_VISIBLE_SUBJECTS = 3

/** Tarjeta de un aula: turquesa claro con borde lateral navy. Todo el título abre el detalle. */
export const ClassroomCard = ({ classroom, onEdit, onArchive, onRestore }) => {
    const subjects = classroom.subjects ?? []
    const extra = subjects.length - MAX_VISIBLE_SUBJECTS
    const count = classroom.activeStudentCount ?? 0

    return (
        <Card as={LinkBox} borderLeftWidth="6px" borderLeftColor="border.strong" h="full" opacity={classroom.isActive ? 1 : 0.92}>
            <CardBody pb={2}>
                <Stack spacing={3}>
                    <Flex justify="space-between" align="flex-start" gap={2}>
                        <Heading as="h2" size="md" noOfLines={2}>
                            <LinkOverlay as={RouterLink} to={ROUTES.classroomDetail(classroom.id)}>
                                {classroom.name}
                            </LinkOverlay>
                        </Heading>
                        <ClassroomStatusBadge isActive={classroom.isActive} />
                    </Flex>
                    <Text fontWeight="medium">{classroomGradeLabel(classroom)}</Text>
                    <Flex gap={4} wrap="wrap" fontSize="sm">
                        <Flex align="center" gap={1.5}>
                            <Icon as={FiCalendar} aria-hidden />
                            Ciclo {classroom.schoolYear}
                        </Flex>
                        <Flex align="center" gap={1.5}>
                            <Icon as={FiUsers} aria-hidden />
                            {count} {count === 1 ? 'estudiante activo' : 'estudiantes activos'}
                        </Flex>
                    </Flex>
                    {subjects.length > 0 ? (
                        <Wrap spacing={1.5} aria-label="Materias">
                            {subjects.slice(0, MAX_VISIBLE_SUBJECTS).map((subject) => (
                                <WrapItem key={subject.id}>
                                    <Tag size="sm" bg="bg.option" color="text.primary" borderWidth="1px" borderColor="border.subtle">
                                        {subject.name}
                                    </Tag>
                                </WrapItem>
                            ))}
                            {extra > 0 && (
                                <WrapItem>
                                    <Tag size="sm" bg="bg.option" color="text.primary">
                                        +{extra} más
                                    </Tag>
                                </WrapItem>
                            )}
                        </Wrap>
                    ) : (
                        <Text fontSize="sm" fontStyle="italic">
                            Sin materias asignadas
                        </Text>
                    )}
                </Stack>
            </CardBody>
            {/* Los botones quedan por encima del enlace de la tarjeta */}
            <CardFooter pt={2} gap={2} flexWrap="wrap" position="relative" zIndex={1}>
                {classroom.isActive ? (
                    <>
                        <Button size="sm" variant="secondary" leftIcon={<FiEdit2 />} onClick={() => onEdit(classroom)}>
                            Editar
                        </Button>
                        <Button size="sm" variant="ghost" leftIcon={<FiArchive />} onClick={() => onArchive(classroom)}>
                            Archivar
                        </Button>
                    </>
                ) : (
                    <Button size="sm" variant="secondary" leftIcon={<FiRotateCcw />} onClick={() => onRestore(classroom)}>
                        Restaurar
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
