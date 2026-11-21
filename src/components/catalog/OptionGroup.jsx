import { Box, Flex, Icon, SimpleGrid, useRadio, useRadioGroup } from '@chakra-ui/react'
import { FiCheckCircle } from 'react-icons/fi'

/**
 * Opción seleccionable con aspecto de tarjeta. Por dentro es un radio nativo, así funciona con
 * teclado (flechas, espacio) y los lectores de pantalla anuncian "seleccionado".
 */
const OptionCard = ({ children, ...radioProps }) => {
    const { state, getInputProps, getRadioProps, htmlProps, getLabelProps } = useRadio(radioProps)
    const input = getInputProps()
    // Chakra marca el control visual con aria-hidden; aquí el control ES el texto de la opción,
    // así que se quita para que el lector de pantalla lea el nombre del radio.
    const { 'aria-hidden': _hidden, ...card } = getRadioProps()

    return (
        <Box as="label" {...htmlProps} {...getLabelProps()} display="block" cursor="pointer" h="full">
            <input {...input} />
            <Flex
                {...card}
                h="full"
                align="flex-start"
                gap={3}
                px={4}
                py={3}
                borderRadius="lg"
                borderWidth="2px"
                borderColor="border.subtle"
                bg="bg.option"
                color="text.primary"
                transition="background-color 0.15s, border-color 0.15s"
                _hover={{ bg: 'bg.optionHover' }}
                _checked={{
                    bg: 'bg.optionSelected',
                    borderColor: 'border.selected',
                    boxShadow: 'inset 4px 0 0 var(--chakra-colors-navy-500)'
                }}
                _focusVisible={{ outline: '3px solid', outlineColor: 'focus.ring', outlineOffset: '2px' }}
            >
                <Box flex="1" minW={0}>
                    {children}
                </Box>
                <Icon
                    as={FiCheckCircle}
                    boxSize={5}
                    mt={0.5}
                    color="text.primary"
                    visibility={state.isChecked ? 'visible' : 'hidden'}
                    aria-hidden
                />
            </Flex>
        </Box>
    )
}

/**
 * Grupo de opciones de selección única (grados, materias, temas).
 *
 * @param {object} props
 * @param {string} props.name           nombre del grupo de radios
 * @param {string} props.label          nombre accesible del grupo
 * @param {Array}  props.options        elementos con `id`
 * @param {string|null} props.value     id seleccionado
 * @param {(id: string) => void} props.onChange
 * @param {(option: any) => import('react').ReactNode} props.renderOption
 * @param {object} [props.columns]      columnas responsivas de la cuadrícula
 */
export const OptionGroup = ({ name, label, options, value, onChange, renderOption, columns = { base: 1 }, spacing = 3 }) => {
    const { getRootProps, getRadioProps } = useRadioGroup({ name, value: value ?? '', onChange })

    return (
        <SimpleGrid {...getRootProps()} role="radiogroup" aria-label={label} columns={columns} spacing={spacing}>
            {options.map((option) => (
                <OptionCard key={option.id} {...getRadioProps({ value: option.id })}>
                    {renderOption(option)}
                </OptionCard>
            ))}
        </SimpleGrid>
    )
}
