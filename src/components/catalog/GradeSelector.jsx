import { Text } from '@chakra-ui/react'
import { OptionGroup } from './OptionGroup.jsx'
import { gradeOrdinal } from '../../utils/catalog.js'

/** Selector de grado de primaria (datos de GET /api/grades). */
export const GradeSelector = ({ grades, value, onChange }) => (
    <OptionGroup
        name="grado"
        label="Grados de primaria"
        options={grades}
        value={value}
        onChange={onChange}
        columns={{ base: 2, sm: 3, lg: 6 }}
        renderOption={(grade) => (
            <>
                <Text as="span" display="block" fontSize="2xl" fontWeight="bold" color="text.primary" lineHeight="short">
                    {gradeOrdinal(grade.number)}
                </Text>
                <Text as="span" display="block" fontSize="sm" color="text.secondary">
                    {grade.name}
                </Text>
            </>
        )}
    />
)
