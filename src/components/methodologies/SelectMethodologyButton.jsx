import { Button } from '@chakra-ui/react'
import { FiCheckCircle, FiCircle } from 'react-icons/fi'
import { useGuidePlanning } from '../../hooks/useGuidePlanning.js'

/**
 * Elige (o deja de elegir) la metodología para la próxima guía de clase. Es un botón de alternancia
 * (aria-pressed): solo puede haber una metodología seleccionada.
 */
export const SelectMethodologyButton = ({ methodology, size = 'sm', onChange }) => {
    const { isSelected, selectMethodology, clearMethodology } = useGuidePlanning()
    const selected = isSelected(methodology.id)

    const toggle = () => {
        if (selected) clearMethodology()
        else selectMethodology(methodology)
        onChange?.(!selected)
    }

    return (
        <Button
            size={size}
            variant={selected ? 'primary' : 'secondary'}
            leftIcon={selected ? <FiCheckCircle /> : <FiCircle />}
            aria-pressed={selected}
            onClick={toggle}
            isDisabled={methodology.isActive === false}
        >
            {selected ? 'Seleccionada para guía' : 'Usar en mi próxima guía'}
        </Button>
    )
}
