import { useState } from 'react'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden')
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    try {
      setError('')
      setLoading(true)
      await register(email, password, fullName)
    } catch (error: any) {
      let message = 'Error al crear la cuenta'
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo ya está registrado'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Correo electrónico inválido'
      } else if (error.code === 'auth/weak-password') {
        message = 'La contraseña es muy débil'
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center">
      <Card style={{ maxWidth: '400px', width: '100%' }} className="shadow-sm">
        <Card.Body className="p-4">
          <Button
            variant="link"
            className="text-muted p-0 mb-3 text-decoration-none d-flex align-items-center"
            onClick={() => navigate('/')}
          >
            <span style={{ fontSize: '1.2rem' }}>←</span>
            <span className="ms-2">Volver al inicio</span>
          </Button>
          <div className="text-center mb-3">
            <img src="/logo.png" alt="MandaFácil" style={{ height: '40px', width: 'auto' }} />
          </div>
          <h3 className="text-center mb-4">Crear Cuenta</h3>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre Completo</Form.Label>
              <Form.Control
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
            <div className="text-center">
              <small className="text-muted">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-decoration-none">
                  Inicia sesión
                </Link>
              </small>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
