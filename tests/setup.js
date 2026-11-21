import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { restoreApi } from './mockApi.js'

afterEach(() => {
    cleanup()
    restoreApi()
    window.localStorage.clear()
    window.sessionStorage.clear()
})

// jsdom no implementa matchMedia (lo usa Chakra UI)
if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
    })
}
