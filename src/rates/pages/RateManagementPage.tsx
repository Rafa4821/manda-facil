import { useState, useEffect } from 'react'
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useAuth } from '../../auth/context/AuthContext'
import { rateService } from '../services/rateService'
import { Rate } from '../types/rate'

export function RateManagementPage() {
  const { user } = useAuth()
  const [currentRate, setCurrentRate] = useState<Rate | null>(null)
  const [newRate, setNewRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCurrentRate()
  }, [])

  const loadCurrentRate = async () => {
    try {
      setLoading(true)
      const rate = await rateService.getCurrentRate()
      setCurrentRate(rate)
      if (rate) {
        setNewRate(rate.clpToVes.toString())
      }
    } catch (error) {
      setError('Error al cargar la tasa actual')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('No hay sesión activa')
      return
    }

    const rateValue = parseFloat(newRate)
    
    if (isNaN(rateValue) || rateValue <= 0) {
      setError('La tasa debe ser un número positivo')
      return
    }

    try {
      setError('')
      setSuccess('')
      setUpdating(true)
      
      await rateService.updateRate(rateValue, user.uid)
      
      setSuccess('Tasa actualizada correctamente')
      await loadCurrentRate()
    } catch (error: any) {
      if (error.code === 'permission-denied') {
        setError('No tienes permisos para actualizar la tasa')
      } else {
        setError('Error al actualizar la tasa')
      }
    } finally {
      setUpdating(false)
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
      <h2 className="mb-4">Gestión de Tasa de Cambio</h2>
      
      <Row>
        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title>Tasa Actual</Card.Title>
              {currentRate ? (
                <>
                  <h3 className="text-primary mb-3">
                    1 CLP = {currentRate.clpToVes.toFixed(4)} VES
                  </h3>
                  <p className="text-muted mb-1">
                    <strong>Última actualización:</strong>{' '}
                    {new Date(currentRate.updatedAt).toLocaleString('es-CL')}
                  </p>
                  <p className="text-muted mb-0">
                    <strong>Actualizado por:</strong> {currentRate.updatedBy}
                  </p>
                </>
              ) : (
                <Alert variant="warning">
                  No hay tasa configurada. Por favor, establece una tasa inicial.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title>Actualizar Tasa</Card.Title>
              {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
              {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nueva Tasa (CLP a VES)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.0001"
                    placeholder="Ej: 36.5000"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    required
                    disabled={updating}
                  />
                  <Form.Text className="text-muted">
                    Ingresa cuántos bolívares (VES) equivalen a 1 peso chileno (CLP)
                  </Form.Text>
                </Form.Group>

                <div className="mb-3 p-3 bg-light rounded">
                  <h6>Ejemplo de cálculo:</h6>
                  {newRate && !isNaN(parseFloat(newRate)) && parseFloat(newRate) > 0 ? (
                    <>
                      <p className="mb-1">10,000 CLP = {(10000 * parseFloat(newRate)).toFixed(2)} VES</p>
                      <p className="mb-0">50,000 CLP = {(50000 * parseFloat(newRate)).toFixed(2)} VES</p>
                    </>
                  ) : (
                    <p className="text-muted mb-0">Ingresa una tasa para ver ejemplos</p>
                  )}
                </div>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100"
                  disabled={updating}
                >
                  {updating ? 'Actualizando...' : 'Actualizar Tasa'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Alert variant="info">
        <Alert.Heading>Información Importante</Alert.Heading>
        <p className="mb-0">
          La tasa de cambio se aplicará inmediatamente a todos los pedidos nuevos. 
          Los pedidos existentes mantienen la tasa con la que fueron creados.
        </p>
      </Alert>
    </div>
  )
}
