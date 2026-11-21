import { FormControl, FormLabel, Icon, Input, InputGroup, InputLeftElement } from '@chakra-ui/react'
import { FiSearch } from 'react-icons/fi'

/** Campo de búsqueda con etiqueta visible. */
export const SearchInput = ({ id, label, value, onChange, placeholder, maxW }) => (
    <FormControl maxW={maxW}>
        <FormLabel htmlFor={id}>{label}</FormLabel>
        <InputGroup>
            <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="text.secondary" aria-hidden />
            </InputLeftElement>
            <Input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" />
        </InputGroup>
    </FormControl>
)
