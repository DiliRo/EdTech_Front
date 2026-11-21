import { Box, SimpleGrid, Tag, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { ClassroomStatusBadge } from './ClassroomCard.jsx'
import { formatDate } from '../../utils/classroom.js'

const Item = ({ label, children }) => (
    <Box bg="bg.option" px={4} py={3} borderRadius="lg" borderLeftWidth="4px" borderLeftColor="border.strong">
        <Text as="dt" fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="bold" color="text.primary">
            {label}
        </Text>
        <Box as="dd" mt={1}>
            {children}
        </Box>
    </Box>
)

/** Información general del aula. */
export const ClassroomInfo = ({ classroom }) => {
    const subjects = classroom.subjects ?? []
    const count = classroom.activeStudentCount ?? 0
    return (
        <Box as="dl">
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
                <Item label="Grado">{classroom.grade?.name ?? 'Sin grado'}</Item>
                <Item label="Sección">{classroom.section}</Item>
                <Item label="Ciclo escolar">{classroom.schoolYear}</Item>
                <Item label="Estudiantes activos">{count}</Item>
                <Box gridColumn={{ sm: 'span 2', lg: 'span 3' }}>
                    <Item label="Materias">
                        {subjects.length ? (
                            <Wrap spacing={1.5}>
                                {subjects.map((subject) => (
                                    <WrapItem key={subject.id}>
                                        <Tag size="sm" bg="bg.optionSelected" color="text.primary">
                                            {subject.name}
                                        </Tag>
                                    </WrapItem>
                                ))}
                            </Wrap>
                        ) : (
                            <Text fontStyle="italic">Sin materias asignadas</Text>
                        )}
                    </Item>
                </Box>
                <Item label="Estado">
                    <ClassroomStatusBadge isActive={classroom.isActive} />
                    {classroom.createdAt && (
                        <Text fontSize="xs" mt={1}>
                            Creada el {formatDate(classroom.createdAt)}
                        </Text>
                    )}
                </Item>
            </SimpleGrid>
        </Box>
    )
}
