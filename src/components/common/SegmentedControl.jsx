import { Box, Flex, Text, useRadio, useRadioGroup } from '@chakra-ui/react'

const Segment = ({ children, ...radioProps }) => {
    const { getInputProps, getRadioProps, htmlProps, getLabelProps } = useRadio(radioProps)
    const { 'aria-hidden': _hidden, ...control } = getRadioProps()
    return (
        <Box as="label" {...htmlProps} {...getLabelProps()} flex={{ base: 1, sm: 'initial' }}>
            <input {...getInputProps()} />
            <Box
                {...control}
                cursor="pointer"
                textAlign="center"
                px={{ base: 2, sm: 4 }}
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                lineHeight="short"
                py={1.5}
                borderRadius="md"
                fontWeight="semibold"
                fontSize="sm"
                color="text.primary"
                _hover={{ bg: 'bg.optionHover' }}
                _checked={{ bg: 'bg.sidebar', color: 'text.onDark', _hover: { bg: 'bg.sidebar' } }}
                _focusVisible={{ outline: '3px solid', outlineColor: 'focus.ring', outlineOffset: '2px' }}
            >
                {children}
            </Box>
        </Box>
    )
}

/** Selector de una opción entre pocas (p. ej. Activas / Archivadas / Todas). */
export const SegmentedControl = ({ name, label, options, value, onChange }) => {
    const { getRootProps, getRadioProps } = useRadioGroup({ name, value, onChange })
    return (
        <Box>
            <Text id={`${name}-label`} fontWeight="semibold" color="text.primary" fontSize="sm" mb={2}>
                {label}
            </Text>
            <Flex
                {...getRootProps()}
                role="radiogroup"
                aria-labelledby={`${name}-label`}
                display="inline-flex"
                flexWrap={{ base: 'wrap', sm: 'nowrap' }}
                w={{ base: 'full', sm: 'auto' }}
                gap={1}
                p={1}
                bg="bg.option"
                borderRadius="lg"
                borderWidth="2px"
                borderColor="border.subtle"
            >
                {options.map((option) => (
                    <Segment key={option.value} {...getRadioProps({ value: option.value })}>
                        {option.label}
                    </Segment>
                ))}
            </Flex>
        </Box>
    )
}
