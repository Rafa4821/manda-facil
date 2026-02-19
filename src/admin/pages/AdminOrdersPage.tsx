import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Badge, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { orderService } from '../../orders/services/orderService'
import { Order } from '../../orders/types/order'
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

export function AdminOrdersPage() {
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const allOrders = await orderService.getAllOrders(statusFilter)
      setOrders(allOrders)
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

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'created' || o.status === 'clp_receipt_uploaded').length,
      processing: orders.filter(o => o.status === 'clp_verified' || o.status === 'processing' || o.status === 'paid_out').length,
      completed: orders.filter(o => o.status === 'completed').length,
    }
  }

  const stats = getOrderStats()

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
      <h2 className="mb-4">Gestión de Pedidos</h2>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="text-muted small">Total Pedidos</Card.Title>
              <h3 className="mb-0">{stats.total}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-warning">
            <Card.Body>
              <Card.Title className="text-muted small">Pendientes</Card.Title>
              <h3 className="mb-0 text-warning">{stats.pending}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-info">
            <Card.Body>
              <Card.Title className="text-muted small">Procesando</Card.Title>
              <h3 className="mb-0 text-info">{stats.processing}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-success">
            <Card.Body>
              <Card.Title className="text-muted small">Completados</Card.Title>
              <h3 className="mb-0 text-success">{stats.completed}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Filtrar por estado</Form.Label>
                <Form.Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="created">Creados</option>
                  <option value="clp_receipt_uploaded">Con Comprobante CLP</option>
                  <option value="clp_verified">CLP Verificado</option>
                  <option value="processing">Procesando</option>
                  <option value="paid_out">VES Pagado</option>
                  <option value="completed">Completados</option>
                  <option value="rejected">Rechazados</option>
                  <option value="cancelled">Cancelados</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={9} className="text-end">
              <Button variant="outline-secondary" onClick={loadOrders}>
                🔄 Actualizar
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {orders.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">No hay pedidos</h5>
            <p className="text-muted mb-0">
              {statusFilter !== 'all' 
                ? `No hay pedidos con estado "${statusFilter}"`
                : 'Aún no se han creado pedidos'
              }
            </p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body>
            <div className="table-responsive">
              {/* Desktop Table View */}
              <Table responsive hover className="desktop-table-view">
                <thead>
                  <tr>
                    <th>N° Pedido</th>
                    <th>Cliente</th>
                    <th>CLP</th>
                    <th>VES</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Comprobante</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr 
                      key={order.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <td>
                        <strong>{order.orderNumber}</strong>
                      </td>
                      <td>
                        <div>{order.customerName}</div>
                        <small className="text-muted">{order.customerEmail}</small>
                      </td>
                      <td>
                        {order.amountClp?.toLocaleString('es-CL') || '0'} CLP
                      </td>
                      <td>
                        {order.amountVesExpected?.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }) || '0.00'} VES
                      </td>
                      <td>
                        {getStatusBadge(order.status)}
                      </td>
                      <td>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </td>
                      <td>
                        {order.clpReceiptUrl ? (
                          <Badge bg="success">✓ CLP</Badge>
                        ) : (
                          <Badge bg="secondary">Pendiente</Badge>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/orders/${order.id}`)
                          }}
                        >
                          Ver Detalle →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Mobile Card View */}
              <div className="mobile-card-view">
                {orders.map((order) => (
                  <div 
                    key={order.id}
                    className="order-card-mobile"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <div className="order-card-header">
                      <div>
                        <strong className="d-block">{order.orderNumber}</strong>
                        <small className="text-muted d-block">{order.customerName}</small>
                        <small className="text-muted">{order.customerEmail}</small>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="order-card-body">
                      <div className="order-card-row">
                        <span className="order-card-label">Monto CLP</span>
                        <span className="order-card-value text-primary">
                          ${order.amountClp?.toLocaleString('es-CL') || '0'}
                        </span>
                      </div>

                      <div className="order-card-row">
                        <span className="order-card-label">Monto VES</span>
                        <span className="order-card-value text-success">
                          {order.amountVesExpected?.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }) || '0.00'}
                        </span>
                      </div>

                      <div className="order-card-row">
                        <span className="order-card-label">Fecha</span>
                        <span className="order-card-value">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>

                      <div className="order-card-row">
                        <span className="order-card-label">Comprobante</span>
                        <span className="order-card-value">
                          {order.clpReceiptUrl ? (
                            <Badge bg="success">✓ CLP</Badge>
                          ) : (
                            <Badge bg="secondary">Pendiente</Badge>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="order-card-footer">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/orders/${order.id}`)
                        }}
                      >
                        Ver Detalle →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
