import { forwardRef, useState } from 'react'
import { IconButton, Input, InputGroup, InputRightElement } from '@chakra-ui/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

/** Campo de contraseña con botón para mostrar u ocultar el texto. */
export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false)
    return (
        <InputGroup>
            <Input ref={ref} type={visible ? 'text' : 'password'} pr="3rem" {...props} />
            <InputRightElement>
                <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    icon={visible ? <FiEyeOff /> : <FiEye />}
                    onClick={() => setVisible((v) => !v)}
                />
            </InputRightElement>
        </InputGroup>
    )
})
