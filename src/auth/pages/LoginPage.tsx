import { useState } from 'react'
import { Card, Form, Button, Alert } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)
      await login(email, password)
    } catch (error: any) {
      let message = 'Error al iniciar sesión'
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Correo o contraseña incorrectos'
      } else if (error.code === 'auth/invalid-email') {
        message = 'Correo electrónico inválido'
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Intenta más tarde'
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
            <img src="/logo.png" alt="MandaFácil" style={{ height: '50px', width: 'auto' }} />
          </div>
          <h3 className="text-center mb-4">Iniciar Sesión</h3>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
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
                disabled={loading}
              />
            </Form.Group>
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Ingresar'}
            </Button>
            <div className="text-center">
              <small className="text-muted">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-decoration-none">
                  Regístrate
                </Link>
              </small>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
