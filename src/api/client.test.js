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
})
