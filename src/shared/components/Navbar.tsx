import { Navbar as BSNavbar, Container, Nav, Button } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'

export function Navbar() {
  const { logout, user, userProfile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const isAdmin = userProfile?.role === 'admin'

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BSNavbar.Brand as={Link} to={isAdmin ? '/admin' : '/app'}>
          <img 
            src="/logo.png" 
            alt="MandaFácil" 
            height="40"
            className="d-inline-block align-top"
          />
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {isAdmin ? (
              <>
                <Nav.Link as={Link} to="/admin">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/admin/orders">Pedidos</Nav.Link>
                <Nav.Link as={Link} to="/admin/rate">Tasa</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/app">Inicio</Nav.Link>
                <Nav.Link as={Link} to="/app/orders">Mis Pedidos</Nav.Link>
              </>
            )}
            {user && (
              <span className="text-white me-3 d-none d-lg-block">
                {user.displayName || user.email}
              </span>
            )}
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}
