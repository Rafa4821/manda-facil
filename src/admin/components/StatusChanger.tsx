import { useState } from 'react'
import { Form, Button, Alert, Card } from 'react-bootstrap'
import { OrderStatus } from '../../orders/types/order'
import { orderService } from '../../orders/services/orderService'
import { orderEventService } from '../../orders/services/orderEventService'

interface StatusChangerProps {
  orderId: string
  currentStatus: OrderStatus
  adminId: string
  adminName: string
  onStatusChanged: () => void
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'created', label: 'Creado', color: 'secondary' },
  { value: 'clp_receipt_uploaded', label: 'Comprobante CLP Subido', color: 'info' },
  { value: 'clp_verified', label: 'CLP Verificado', color: 'primary' },
  { value: 'processing', label: 'Procesando', color: 'warning' },
  { value: 'paid_out', label: 'VES Pagado', color: 'success' },
  { value: 'completed', label: 'Completado', color: 'success' },
  { value: 'rejected', label: 'Rechazado', color: 'danger' },
  { value: 'cancelled', label: 'Cancelado', color: 'dark' },
]

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  created: ['clp_receipt_uploaded', 'cancelled'],
  clp_receipt_uploaded: ['clp_verified', 'rejected', 'cancelled'],
  clp_verified: ['processing', 'rejected'],
  processing: ['paid_out', 'cancelled'],
  paid_out: ['completed'],
  completed: [],
  rejected: ['created'],
  cancelled: [],
}

export function StatusChanger({ 
  orderId, 
  currentStatus, 
  adminId, 
  adminName,
  onStatusChanged 
}: StatusChangerProps) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(currentStatus)
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const allowedStatuses = STATUS_FLOW[currentStatus] || []
  const availableOptions = STATUS_OPTIONS.filter(
    opt => allowedStatuses.includes(opt.value)
  )

  const handleStatusChange = async () => {
    if (newStatus === currentStatus) {
      setError('Debes seleccionar un estado diferente')
      return
    }

    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      // Update order status
      const completedAt = newStatus === 'completed' ? new Date() : undefined
      await orderService.updateOrderStatus(orderId, newStatus, completedAt)

      // Create event log
      await orderEventService.createEvent(orderId, {
        fromStatus: currentStatus,
        toStatus: newStatus,
        changedBy: adminId,
        changedByName: adminName,
        note: note || undefined,
      })

      setSuccess(`Estado actualizado a: ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`)
      setNote('')
      
      // Notify parent to reload
      setTimeout(() => {
        onStatusChanged()
      }, 1000)
    } catch (error: any) {
      console.error('Error changing status:', error)
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para cambiar el estado')
      } else {
        setError('Error al actualizar el estado. Intenta nuevamente.')
      }
    } finally {
      setUpdating(false)
    }
  }

  if (availableOptions.length === 0) {
    return (
      <Alert variant="info">
        <small>
          No hay transiciones disponibles desde el estado actual: <strong>{STATUS_OPTIONS.find(s => s.value === currentStatus)?.label}</strong>
        </small>
      </Alert>
    )
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-dark text-white">
        <h6 className="mb-0">Cambiar Estado del Pedido</h6>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Estado Actual</Form.Label>
          <div>
            <span className={`badge bg-${STATUS_OPTIONS.find(s => s.value === currentStatus)?.color || 'secondary'} fs-6`}>
              {STATUS_OPTIONS.find(s => s.value === currentStatus)?.label}
            </span>
          </div>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Nuevo Estado</Form.Label>
          <Form.Select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            disabled={updating}
          >
            <option value={currentStatus}>Seleccionar...</option>
            {availableOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Form.Select>
          <Form.Text className="text-muted">
            Solo se muestran las transiciones permitidas
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Nota (Opcional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Ej: Comprobante verificado, pago procesado..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={updating}
          />
        </Form.Group>

        <div className="d-grid">
          <Button
            variant="primary"
            onClick={handleStatusChange}
            disabled={updating || newStatus === currentStatus}
          >
            {updating ? 'Actualizando...' : 'Actualizar Estado'}
          </Button>
        </div>

        <Alert variant="warning" className="mt-3 mb-0">
          <small>
            <strong>⚠️ Importante:</strong> Los cambios de estado quedan registrados en el historial y no se pueden deshacer.
          </small>
        </Alert>
      </Card.Body>
    </Card>
  )
}
