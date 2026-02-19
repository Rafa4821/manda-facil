import { useState, useEffect } from 'react'
import { Card, Badge, Alert, Table, Button } from 'react-bootstrap'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import { orderService } from '../services/orderService'
import { Order } from '../types/order'
import '../../shared/styles/mobile-tables.css'

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { bg: string; text: string }> = {
    created: { bg: 'secondary', text: 'Creado' },
    clp_receipt_uploaded: { bg: 'info', text: 'Comprobante Subido' },
    clp_verified: { bg: 'primary', text: 'Verificado' },
    processing: { bg: 'warning', text: 'Procesando' },
    paid_out: { bg: 'success', text: 'Pagado' },
    completed: { bg: 'success', text: 'Completado' },
    rejected: { bg: 'danger', text: 'Rechazado' },
    cancelled: { bg: 'dark', text: 'Cancelado' },
  }
  
  const statusInfo = statusMap[status] || { bg: 'secondary', text: status }
  
  return (
    <Badge bg={statusInfo.bg}>
      {statusInfo.text}
    </Badge>
  )
}

export function MyOrdersPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check for success message from navigation state
    if (location.state && (location.state as any).message) {
      setSuccessMessage((location.state as any).message)
      // Clear the state
      window.history.replaceState({}, document.title)
    }
    
    if (user) {
      loadOrders()
    }
  }, [user, location])

  const loadOrders = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const customerOrders = await orderService.getCustomerOrders(user.uid)
      setOrders(customerOrders)
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para ver los pedidos')
      } else {
        setError('Error al cargar los pedidos')
      }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Mis Pedidos</h2>
        <Button variant="primary" onClick={() => navigate('/app/new-order')}>
          + Nuevo Pedido
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <h5 className="text-muted mb-3">No tienes pedidos aún</h5>
            <p className="text-muted mb-4">
              Crea tu primer pedido de remesa CLP → VES
            </p>
            <Button variant="primary" onClick={() => navigate('/app/new-order')}>
              Crear Primer Pedido
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="shadow-sm desktop-table-view">
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>N° Pedido</th>
                      <th>Monto CLP</th>
                      <th>Tasa</th>
                      <th>Monto VES</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr 
                        key={order.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/app/orders/${order.id}`)}
                      >
                        <td>
                          <strong>{order.orderNumber}</strong>
                        </td>
                        <td>
                          {order.amountClp.toLocaleString('es-CL')} CLP
                        </td>
                        <td>
                          {order.rateSnapshot.toFixed(4)}
                        </td>
                        <td>
                          {order.amountVesExpected.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} VES
                        </td>
                        <td>
                          {getStatusBadge(order.status)}
                        </td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/app/orders/${order.id}`)
                            }}
                          >
                            Ver Detalle →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {/* Mobile Card View */}
          <div className="mobile-card-view">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="order-card-mobile"
                onClick={() => navigate(`/app/orders/${order.id}`)}
              >
                <div className="order-card-header">
                  <div>
                    <strong className="d-block">{order.orderNumber}</strong>
                    <small className="text-muted">
                      {new Date(order.createdAt).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </small>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                <div className="order-card-body">
                  <div className="order-card-row">
                    <span className="order-card-label">Envías (CLP)</span>
                    <span className="order-card-value text-primary">
                      ${order.amountClp.toLocaleString('es-CL')}
                    </span>
                  </div>

                  <div className="order-card-row">
                    <span className="order-card-label">Recibes (VES)</span>
                    <span className="order-card-value text-success">
                      {order.amountVesExpected.toLocaleString('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </div>

                  <div className="order-card-row">
                    <span className="order-card-label">Tasa</span>
                    <span className="order-card-value">
                      {order.rateSnapshot.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="order-card-footer">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/app/orders/${order.id}`)
                    }}
                  >
                    Ver Detalle →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {orders.length > 0 && (
        <Alert variant="info" className="mt-4">
          <small>
            <strong>Nota:</strong> Puedes crear nuevos pedidos en cualquier momento. 
            La tasa de cambio se fija al momento de crear cada pedido.
          </small>
        </Alert>
      )}
    </div>
  )
}
