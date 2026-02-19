import { Card, Row, Col, Badge } from 'react-bootstrap'
import { useAuth } from '../../auth/context/AuthContext'

export function AdminHomePage() {
  const { userProfile } = useAuth()

  return (
    <div>
      {userProfile && (
        <Card className="mb-4 shadow-sm bg-dark text-white">
          <Card.Body>
            <h2 className="mb-3">
              Hola {userProfile.fullName}{' '}
              <Badge bg="danger">{userProfile.role}</Badge>
            </h2>
            <p className="mb-0 opacity-75">
              <strong>Email:</strong> {userProfile.email}
            </p>
          </Card.Body>
        </Card>
      )}

      <h3 className="mb-4">Panel de Administración</h3>
      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Pedidos Pendientes</Card.Title>
              <h3 className="text-primary mb-0">
                <Badge bg="warning" text="dark">5</Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Completados Hoy</Card.Title>
              <h3 className="text-success mb-0">
                <Badge bg="success">12</Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Tasa Actual</Card.Title>
              <h3 className="text-info mb-0">36.50 Bs</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
