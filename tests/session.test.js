import { describe, it, expect } from 'vitest'
import { decodeTokenPayload, getTokenExpiration, isTokenExpired } from '../src/utils/jwt.js'
import { tokenStorage } from '../src/utils/tokenStorage.js'
import { fakeToken } from './mockApi.js'

describe('Lectura del token JWT', () => {
    it('lee sub y exp del token del backend', () => {
        const token = fakeToken({ sub: 'abc', expiresInSeconds: 3600 })
        expect(decodeTokenPayload(token).sub).toBe('abc')
        expect(getTokenExpiration(token)).toBeGreaterThan(Date.now() + 3500 * 1000)
    })

    it('detecta tokens expirados, próximos a expirar o mal formados', () => {
        expect(isTokenExpired(fakeToken({ expiresInSeconds: 3600 }))).toBe(false)
        expect(isTokenExpired(fakeToken({ expiresInSeconds: -60 }))).toBe(true)
        expect(isTokenExpired(fakeToken({ expiresInSeconds: 5 }))).toBe(true) // margen de 10 s
        for (const bad of ['', 'abc', 'a.b', 'a.###.c', null, undefined, 42]) {
            expect(isTokenExpired(bad), String(bad)).toBe(true)
            expect(decodeTokenPayload(bad)).toBeNull()
        }
    })
})

describe('Almacenamiento de la sesión', () => {
    it('usa sessionStorage (se borra al cerrar la pestaña), no localStorage', () => {
        tokenStorage.set('token-1')
        expect(window.sessionStorage.length).toBe(1)
        expect(window.localStorage.length).toBe(0)
        expect(tokenStorage.get()).toBe('token-1')
        tokenStorage.clear()
        expect(tokenStorage.get()).toBeNull()
    })
})
