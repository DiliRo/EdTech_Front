import { HStack, Icon, Text } from '@chakra-ui/react'
import { FiBookOpen } from 'react-icons/fi'
import { APP_NAME } from '../../utils/constants.js'

/** Logotipo textual. `onDark` para usarlo sobre el menú lateral navy. */
export const BrandLogo = ({ onDark = false, size = 'lg' }) => {
    const color = onDark ? 'text.onDark' : 'text.primary'
    return (
        <HStack spacing={2} color={color}>
            <Icon as={FiBookOpen} boxSize={size === 'lg' ? 7 : 5} aria-hidden />
            <Text as="span" fontSize={size === 'lg' ? '2xl' : 'lg'} fontWeight="extrabold" color={color} letterSpacing="tight">
                {APP_NAME}
            </Text>
        </HStack>
    )
}
