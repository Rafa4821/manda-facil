import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { rateService } from '../../rates/services/rateService';
import { Rate } from '../../rates/types/rate';
import { PWAInstallButton } from '../components';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [currentRate, setCurrentRate] = useState<Rate | null>(null);

  const loadRate = useCallback(async () => {
    try {
      const rate = await rateService.getCurrentRate();
      setCurrentRate(rate);
    } catch (error) {
      console.error('Error loading rate:', error);
    }
  }, []);

  useEffect(() => {
    loadRate();
  }, [loadRate]);

  return (
    <div className="landing-page">
      {/* Logo Header */}
      <div className="position-absolute top-0 start-0 p-3" style={{ zIndex: 10 }}>
        <img src="/logo.png" alt="MandaFácil" style={{ height: '40px', width: 'auto' }} />
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center min-vh-100 py-5">
            <Col lg={6} className="text-center text-lg-start mb-5 mb-lg-0">
              <div className="hero-content">
                <h1 className="display-3 fw-bold mb-4 animate-fade-in">
                  Envía dinero de <span className="text-gradient">Chile a Venezuela</span>
                </h1>
                <p className="lead mb-4 text-muted animate-fade-in-delay">
                  Rápido, seguro y al mejor tipo de cambio. Transfiere CLP y recibe VES en minutos.
                </p>

                {currentRate && (
                  <div className="rate-card animate-slide-up">
                    <Card className="border-0 shadow-lg">
                      <Card.Body className="p-4">
                        <div className="d-flex align-items-center justify-content-between">
                          <div>
                            <small className="text-muted d-block mb-1">Tasa de hoy</small>
                            <h3 className="mb-0 text-primary fw-bold">
                              1 CLP = {currentRate.clpToVes.toFixed(4)} VES
                            </h3>
                          </div>
                          <div className="rate-icon">
                            <span className="display-4">💱</span>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                )}

                <div className="d-grid gap-3 d-md-flex justify-content-md-start mt-4 animate-fade-in-delay-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-5 py-3 fw-bold"
                    onClick={() => navigate('/register')}
                  >
                    Comenzar Ahora →
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    className="px-5 py-3"
                    onClick={() => navigate('/login')}
                  >
                    Iniciar Sesión
                  </Button>
                </div>

                <div className="mt-4 animate-fade-in-delay-2">
                  <PWAInstallButton />
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <div className="hero-illustration animate-float">
                <div className="phone-mockup">
                  <div className="phone-screen">
                    <div className="status-bar"></div>
                    <div className="app-preview">
                      <div className="preview-card">
                        <div className="shimmer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section py-5">
        <Container>
          <h2 className="text-center mb-5 fw-bold">¿Por qué elegirnos?</h2>
          <Row className="g-4">
            <Col md={4}>
              <Card className="benefit-card h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="benefit-icon mb-3">⚡</div>
                  <h4 className="mb-3">Rápido</h4>
                  <p className="text-muted">
                    Transferencias procesadas en minutos. No esperes días para que llegue tu dinero.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="benefit-card h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="benefit-icon mb-3">🔒</div>
                  <h4 className="mb-3">Seguro</h4>
                  <p className="text-muted">
                    Tus datos y transacciones protegidos con la mejor tecnología de seguridad.
                  </p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="benefit-card h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="benefit-icon mb-3">💰</div>
                  <h4 className="mb-3">Mejor Tasa</h4>
                  <p className="text-muted">
                    Tipo de cambio competitivo actualizado diariamente para que aproveches al máximo.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section py-5 bg-light">
        <Container>
          <h2 className="text-center mb-5 fw-bold">Cómo funciona</h2>
          <Row className="g-4">
            <Col md={4}>
              <div className="step-card text-center">
                <div className="step-number mb-3">1</div>
                <h5 className="mb-3">Crea tu pedido</h5>
                <p className="text-muted">
                  Ingresa el monto en CLP y tus datos bancarios en Venezuela donde recibirás.
                </p>
              </div>
            </Col>

            <Col md={4}>
              <div className="step-card text-center">
                <div className="step-number mb-3">2</div>
                <h5 className="mb-3">Transfiere CLP</h5>
                <p className="text-muted">
                  Realiza la transferencia a nuestra cuenta y sube el comprobante.
                </p>
              </div>
            </Col>

            <Col md={4}>
              <div className="step-card text-center">
                <div className="step-number mb-3">3</div>
                <h5 className="mb-3">Recibe VES</h5>
                <p className="text-muted">
                  Recibirás los bolívares en tu cuenta venezolana en minutos.
                </p>
              </div>
            </Col>
          </Row>

          <div className="text-center mt-5">
            <Button
              variant="primary"
              size="lg"
              className="px-5 py-3 fw-bold"
              onClick={() => navigate('/register')}
            >
              Empezar Ahora →
            </Button>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="footer-section py-4 bg-dark text-white">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <h5 className="mb-0">MandaFácil</h5>
              <small className="text-muted">Remesas Chile - Venezuela</small>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <small className="text-muted">
                © 2024 MandaFácil. Todos los derechos reservados.
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
