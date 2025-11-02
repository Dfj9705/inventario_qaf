import { describe, expect, test } from 'vitest'
import { Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
  test('devuelve los children cuando hay un token válido', () => {
    const children = <div>Contenido protegido</div>

    const result = ProtectedRoute({ token: 'token-valido', children })

    expect(result).toBe(children)
  })

  test('devuelve un componente Navigate cuando falta el token', () => {
    const result = ProtectedRoute({ token: '', children: <div /> })

    expect(result.type).toBe(Navigate)
    expect(result.props.to).toBe('/login')
    expect(result.props.replace).toBe(true)
  })
})
