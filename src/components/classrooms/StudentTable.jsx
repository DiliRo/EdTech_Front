import { Badge, Button, Flex, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VisuallyHidden } from '@chakra-ui/react'
import { FiEdit2, FiRotateCcw, FiTrendingUp, FiUserMinus } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { ROUTES } from '../../utils/constants.js'
import { formatDate } from '../../utils/classroom.js'

const StudentStatus = ({ isActive }) =>
    isActive ? (
        <Badge bg="status.successBg" color="status.success" borderWidth="1px" borderColor="status.success">
            Activo
        </Badge>
    ) : (
        <Badge bg="status.warningBg" color="status.warning" borderWidth="1px" borderColor="status.warning">
            Retirado
        </Badge>
    )

/**
 * Estudiantes del aula: código, estado, fecha de registro y acciones. Filas alternas en turquesa.
 * Solo se muestra dentro del detalle de un aula del docente.
 */
export const StudentTable = ({ students, onEdit, onWithdraw, onReinstate, canReinstate = true }) => (
    <TableContainer borderRadius="md" borderWidth="1px" borderColor="border.subtle" bg="bg.option">
        <Table size="sm">
            <VisuallyHidden as="caption">Estudiantes del aula</VisuallyHidden>
            <Thead>
                <Tr>
                    <Th scope="col">Código</Th>
                    <Th scope="col">Estado</Th>
                    <Th scope="col" display={{ base: 'none', md: 'table-cell' }}>
                        Registrado
                    </Th>
                    <Th scope="col" textAlign="right">
                        Acciones
                    </Th>
                </Tr>
            </Thead>
            <Tbody>
                {students.map((student) => (
                    <Tr key={student.id}>
                        <Td>
                            <Text as="span" fontFamily="mono" fontWeight="bold" color="text.primary" fontSize="md">
                                {student.studentCode}
                            </Text>
                        </Td>
                        <Td>
                            <StudentStatus isActive={student.isActive} />
                        </Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>{formatDate(student.createdAt)}</Td>
                        <Td>
                            <Flex justify="flex-end" gap={1} wrap="wrap">
                                <Button
                                    as={RouterLink}
                                    to={ROUTES.studentProgress(student.id)}
                                    size="xs"
                                    variant="ghost"
                                    leftIcon={<FiTrendingUp />}
                                    aria-label={`Historial de ${student.studentCode}`}
                                >
                                    Historial
                                </Button>
                                <Button size="xs" variant="ghost" leftIcon={<FiEdit2 />} onClick={() => onEdit(student)} aria-label={`Editar código ${student.studentCode}`}>
                                    Editar
                                </Button>
                                {student.isActive ? (
                                    <Button size="xs" variant="ghost" leftIcon={<FiUserMinus />} onClick={() => onWithdraw(student)} aria-label={`Retirar a ${student.studentCode}`}>
                                        Retirar
                                    </Button>
                                ) : (
                                    canReinstate && (
                                        <Button size="xs" variant="ghost" leftIcon={<FiRotateCcw />} onClick={() => onReinstate(student)} aria-label={`Reincorporar a ${student.studentCode}`}>
                                            Reincorporar
                                        </Button>
                                    )
                                )}
                            </Flex>
                        </Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    </TableContainer>
)
