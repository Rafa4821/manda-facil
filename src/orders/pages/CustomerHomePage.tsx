import { useState, useEffect } from 'react'
import { Card, Button, Row, Col, Badge, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { rateService } from '../../rates/services/rateService'
import { Rate } from '../../rates/types/rate'
import { NotificationBanner } from '../../shared/components/NotificationBanner'
import { InstallPrompt } from '../../shared/components/InstallPrompt'

export function CustomerHomePage() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [currentRate, setCurrentRate] = useState<Rate | null>(null)
  const [loadingRate, setLoadingRate] = useState(true)

  useEffect(() => {
    loadRate()
  }, [])

  const loadRate = async () => {
    try {
      const rate = await rateService.getCurrentRate()
      setCurrentRate(rate)
    } catch (error) {
      console.error('Error loading rate:', error)
    } finally {
      setLoadingRate(false)
    }
  }

  return (
    <div>
      {userProfile && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <h2 className="mb-3">
              Hola {userProfile.fullName}{' '}
              <Badge bg={userProfile.role === 'admin' ? 'danger' : 'primary'}>
                {userProfile.role}
              </Badge>
            </h2>
            <p className="text-muted mb-0">
              <strong>Email:</strong> {userProfile.email}
            </p>
            {userProfile.phone && (
              <p className="text-muted mb-0">
                <strong>Teléfono:</strong> {userProfile.phone}
              </p>
            )}
            <p className="text-muted mb-0">
              <strong>Miembro desde:</strong>{' '}
              {new Date(userProfile.createdAt).toLocaleDateString('es-CL')}
            </p>
          </Card.Body>
        </Card>
      )}

      <InstallPrompt />
      <NotificationBanner />

      {!loadingRate && currentRate && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Tasa de cambio actual:</strong>
              <span className="ms-2 fs-5">1 CLP = {currentRate.clpToVes.toFixed(4)} VES</span>
            </div>
            <small className="text-muted">
              Actualizado: {new Date(currentRate.updatedAt).toLocaleDateString('es-CL')}
            </small>
          </div>
        </Alert>
      )}
      
      <h3 className="mb-4">Bienvenido a Mandafácil</h3>
      <Row className="g-4">
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Nuevo Pedido</Card.Title>
              <Card.Text>
                Crea una nueva solicitud de remesa CLP → VES
              </Card.Text>
              <Button variant="primary" onClick={() => navigate('/app/new-order')}>
                Crear Pedido
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>Mis Pedidos</Card.Title>
              <Card.Text>
                Consulta el estado de tus remesas
              </Card.Text>
              <Button variant="outline-primary" onClick={() => navigate('/app/orders')}>
                Ver Pedidos
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
