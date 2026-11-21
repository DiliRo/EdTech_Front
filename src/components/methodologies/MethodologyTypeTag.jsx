import { Tag, TagLabel, TagLeftIcon } from '@chakra-ui/react'
import { FiBookmark, FiEdit3 } from 'react-icons/fi'

/**
 * Distingue predeterminadas (MINEDUC, solo lectura) de las creadas por el docente.
 * Predeterminada: navy sólido. Personalizada: turquesa con borde navy.
 */
export const MethodologyTypeTag = ({ isDefault, size = 'sm' }) =>
    isDefault ? (
        <Tag size={size} bg="bg.sidebar" color="text.onDark" fontWeight="semibold">
            <TagLeftIcon as={FiBookmark} aria-hidden />
            <TagLabel>Predeterminada</TagLabel>
        </Tag>
    ) : (
        <Tag size={size} bg="bg.optionSelected" color="text.primary" fontWeight="semibold" borderWidth="1px" borderColor="border.strong">
            <TagLeftIcon as={FiEdit3} aria-hidden />
            <TagLabel>Personalizada</TagLabel>
        </Tag>
    )
