import { useState, useEffect } from 'react'
import { Card, Row, Col, Badge } from 'react-bootstrap'
import { useAuth } from '../../auth/context/AuthContext'
import { orderService } from '../../orders/services/orderService'
import { rateService } from '../../rates/services/rateService'

export function AdminHomePage() {
  const { userProfile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [currentRate, setCurrentRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all orders
      const orders = await orderService.getAllOrders()
      
      // Count pending orders
      const pending = orders.filter(o => 
        o.status === 'created' || o.status === 'clp_receipt_uploaded'
      ).length
      setPendingCount(pending)
      
      // Count completed today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const completed = orders.filter(o => {
        if (o.status !== 'completed' || !o.completedAt) return false
        const completedDate = new Date(o.completedAt)
        completedDate.setHours(0, 0, 0, 0)
        return completedDate.getTime() === today.getTime()
      }).length
      setCompletedToday(completed)
      
      // Fetch current rate
      const rate = await rateService.getCurrentRate()
      if (rate) {
        setCurrentRate(rate.clpToVes)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

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
                <Badge bg="warning" text="dark">{pendingCount}</Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Completados Hoy</Card.Title>
              <h3 className="text-success mb-0">
                <Badge bg="success">{completedToday}</Badge>
              </h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Tasa Actual</Card.Title>
              <h3 className="text-info mb-0">
                {currentRate ? `${currentRate.toFixed(4)} Bs` : 'No configurada'}
              </h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
