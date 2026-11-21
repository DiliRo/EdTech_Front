import { Text } from '@chakra-ui/react'
import { OptionGroup } from './OptionGroup.jsx'
import { SampleBadge } from './SampleDataNotice.jsx'

/** Selector de materia; recibe solo las materias del grado elegido (GET /api/subjects?grade=). */
export const SubjectSelector = ({ subjects, value, onChange }) => (
    <OptionGroup
        name="materia"
        label="Materias del grado"
        options={subjects}
        value={value}
        onChange={onChange}
        columns={{ base: 1, md: 2, xl: 1 }}
        renderOption={(subject) => (
            <>
                <Text as="span" display="block" fontWeight="semibold" color="text.primary">
                    {subject.name}
                    {subject.isSample && <SampleBadge />}
                </Text>
                {subject.description && (
                    <Text as="span" display="block" mt={1} fontSize="sm" color="text.secondary" noOfLines={2}>
                        {subject.description}
                    </Text>
                )}
            </>
        )}
    />
)
