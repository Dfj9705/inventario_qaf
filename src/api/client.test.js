import { beforeEach, describe, expect, test } from 'vitest'
import apiClient, { setAuthToken } from './client'

describe('apiClient authentication header', () => {
  beforeEach(() => {
    delete apiClient.defaults.headers.common.Authorization
  })

  test('agrega el encabezado Authorization cuando recibe un token', () => {
    setAuthToken('mi-token')

    expect(apiClient.defaults.headers.common.Authorization).toBe('Bearer mi-token')
  })

  test('elimina el encabezado Authorization cuando no hay token', () => {
    apiClient.defaults.headers.common.Authorization = 'Bearer token-existente'

    setAuthToken('')

    expect(apiClient.defaults.headers.common.Authorization).toBeUndefined()
  })

  test('configura Accept con soporte para JSON por defecto', () => {
    expect(apiClient.defaults.headers.common.Accept).toContain('application/json')
  })

  test('usa la URL base por defecto cuando no hay variable de entorno', () => {
    expect(apiClient.defaults.baseURL).toBe('http://inventario-qa.test/api')
  })
})
