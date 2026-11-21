import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, IconButton, Input, Stack, Text, Textarea } from '@chakra-ui/react'
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi'

const move = (list, from, to) => {
    const next = [...list]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    return next
}

const ItemActions = ({ index, count, noun, onMove, onRemove, ordered }) => (
    <Flex gap={1} flexShrink={0}>
        {ordered && (
            <>
                <IconButton size="sm" variant="ghost" icon={<FiArrowUp />} aria-label={`Subir ${noun} ${index + 1}`} onClick={() => onMove(index, index - 1)} isDisabled={index === 0} />
                <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<FiArrowDown />}
                    aria-label={`Bajar ${noun} ${index + 1}`}
                    onClick={() => onMove(index, index + 1)}
                    isDisabled={index === count - 1}
                />
            </>
        )}
        <IconButton size="sm" variant="ghost" icon={<FiTrash2 />} aria-label={`Quitar ${noun} ${index + 1}`} onClick={() => onRemove(index)} />
    </Flex>
)

/**
 * Lista editable de textos (objetivos, materiales). `id` recibe el foco cuando hay un error.
 */
export const StringListEditor = ({ id, label, noun, items, onChange, error, helper, addLabel, maxLength, max = 30, ordered = false }) => (
    <FormControl as="fieldset" isInvalid={Boolean(error)}>
        <FormLabel as="legend">{label}</FormLabel>
        <Stack spacing={2}>
            {items.length === 0 && <Text fontSize="sm">Aún no agregas {noun === 'material' ? 'materiales' : `${noun}s`}.</Text>}
            {items.map((item, index) => (
                <Flex key={index} gap={2} align="center">
                    <Input
                        id={index === 0 ? id : undefined}
                        aria-label={`${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${index + 1}`}
                        value={item}
                        maxLength={maxLength}
                        onChange={(e) => onChange(items.map((value, i) => (i === index ? e.target.value : value)))}
                    />
                    <ItemActions
                        index={index}
                        count={items.length}
                        noun={noun}
                        ordered={ordered}
                        onMove={(from, to) => onChange(move(items, from, to))}
                        onRemove={(i) => onChange(items.filter((_, j) => j !== i))}
                    />
                </Flex>
            ))}
            <Box>
                <Button id={items.length === 0 ? id : undefined} size="sm" variant="secondary" leftIcon={<FiPlus />} onClick={() => onChange([...items, ''])} isDisabled={items.length >= max}>
                    {addLabel}
                </Button>
            </Box>
        </Stack>
        {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText fontSize="sm">{helper}</FormHelperText>}
    </FormControl>
)

/**
 * Lista editable de elementos con título y descripción (pasos, actividades).
 * @param {{ titleLabel: string, descriptionLabel: string, titleRequired?: boolean, descriptionRequired?: boolean }} props
 */
export const ItemListEditor = ({
    id,
    label,
    noun,
    items,
    onChange,
    error,
    helper,
    addLabel,
    titleLabel,
    descriptionLabel,
    titleMax,
    descriptionMax,
    max = 30,
    ordered = false
}) => {
    const update = (index, key, value) => onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
    const Noun = `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`

    return (
        <FormControl as="fieldset" isInvalid={Boolean(error)}>
            <FormLabel as="legend">{label}</FormLabel>
            <Stack spacing={3}>
                {items.length === 0 && <Text fontSize="sm">Aún no agregas {noun === 'actividad' ? 'actividades' : `${noun}s`}.</Text>}
                {items.map((item, index) => (
                    <Box key={index} bg="bg.option" borderRadius="md" borderWidth="1px" borderColor="border.subtle" p={3}>
                        <Flex justify="space-between" align="center" mb={2}>
                            <Text fontWeight="bold" color="text.primary">
                                {Noun} {index + 1}
                            </Text>
                            <ItemActions
                                index={index}
                                count={items.length}
                                noun={noun}
                                ordered={ordered}
                                onMove={(from, to) => onChange(move(items, from, to))}
                                onRemove={(i) => onChange(items.filter((_, j) => j !== i))}
                            />
                        </Flex>
                        <Stack spacing={2}>
                            <Input
                                id={index === 0 ? id : undefined}
                                aria-label={`${titleLabel} del ${noun} ${index + 1}`}
                                placeholder={titleLabel}
                                value={item.title}
                                maxLength={titleMax}
                                onChange={(e) => update(index, 'title', e.target.value)}
                            />
                            <Textarea
                                aria-label={`${descriptionLabel} del ${noun} ${index + 1}`}
                                placeholder={descriptionLabel}
                                value={item.description}
                                maxLength={descriptionMax}
                                rows={2}
                                onChange={(e) => update(index, 'description', e.target.value)}
                            />
                        </Stack>
                    </Box>
                ))}
                <Box>
                    <Button
                        id={items.length === 0 ? id : undefined}
                        size="sm"
                        variant="secondary"
                        leftIcon={<FiPlus />}
                        onClick={() => onChange([...items, { title: '', description: '' }])}
                        isDisabled={items.length >= max}
                    >
                        {addLabel}
                    </Button>
                </Box>
            </Stack>
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : helper && <FormHelperText fontSize="sm">{helper}</FormHelperText>}
        </FormControl>
    )
}
