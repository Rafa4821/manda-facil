import { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Row, Col, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { savedBankAccountService } from '../services/savedBankAccountService';
import { SavedBankAccount, CreateSavedBankAccountData } from '../types/savedBankAccount';
import { VenezuelanBankDetailsForm } from '../components';
import { VenezuelanBankDetails } from '../types/order';

export function SavedAccountsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<SavedBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SavedBankAccount | null>(null);
  
  // Form state
  const [alias, setAlias] = useState('');
  const [bankDetails, setBankDetails] = useState<VenezuelanBankDetails>({
    beneficiaryName: '',
    beneficiaryId: '',
    bank: '',
    accountType: 'ahorro',
    accountNumber: '',
    phone: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  const loadAccounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await savedBankAccountService.getUserSavedAccounts(user.uid);
      setAccounts(data);
    } catch (err) {
      setError('Error al cargar las cuentas guardadas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAlias('');
    setBankDetails({
      beneficiaryName: '',
      beneficiaryId: '',
      bank: '',
      accountType: 'ahorro',
      accountNumber: '',
      phone: '',
      email: '',
    });
  };

  const handleAddAccount = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      const accountData: CreateSavedBankAccountData = {
        alias: alias.trim() || `${bankDetails.bank} - ${bankDetails.accountNumber.slice(-4)}`,
        beneficiaryName: bankDetails.beneficiaryName,
        beneficiaryId: bankDetails.beneficiaryId,
        bank: bankDetails.bank,
        accountType: bankDetails.accountType,
        accountNumber: bankDetails.accountNumber,
        phone: bankDetails.phone,
        email: bankDetails.email,
      };
      
      await savedBankAccountService.createSavedAccount(user.uid, accountData);
      await loadAccounts();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError('Error al guardar la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAccount = async () => {
    if (!user || !editingAccount) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      await savedBankAccountService.updateSavedAccount(user.uid, editingAccount.id, {
        alias: alias.trim(),
        beneficiaryName: bankDetails.beneficiaryName,
        beneficiaryId: bankDetails.beneficiaryId,
        bank: bankDetails.bank,
        accountType: bankDetails.accountType,
        accountNumber: bankDetails.accountNumber,
        phone: bankDetails.phone,
        email: bankDetails.email,
      });
      
      await loadAccounts();
      setShowEditModal(false);
      setEditingAccount(null);
      resetForm();
    } catch (err) {
      setError('Error al actualizar la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!user) return;
    
    const confirmed = window.confirm('¿Estás seguro de eliminar esta cuenta guardada?');
    if (!confirmed) return;
    
    try {
      await savedBankAccountService.deleteSavedAccount(user.uid, accountId);
      await loadAccounts();
    } catch (err) {
      setError('Error al eliminar la cuenta');
    }
  };

  const openEditModal = (account: SavedBankAccount) => {
    setEditingAccount(account);
    setAlias(account.alias);
    setBankDetails({
      beneficiaryName: account.beneficiaryName,
      beneficiaryId: account.beneficiaryId,
      bank: account.bank,
      accountType: account.accountType,
      accountNumber: account.accountNumber,
      phone: account.phone,
      email: account.email || '',
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Cuentas Guardadas</h2>
          <p className="text-muted mb-0">Gestiona tus cuentas bancarias guardadas</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + Nueva Cuenta
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {accounts.length === 0 ? (
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <h5 className="text-muted">No tienes cuentas guardadas</h5>
            <p className="text-muted">Guarda tus cuentas frecuentes para crear pedidos más rápido</p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Agregar Primera Cuenta
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-4">
          {accounts.map(account => (
            <Col key={account.id} md={6} lg={4}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="mb-0">{account.alias}</h5>
                    {account.useCount > 0 && (
                      <Badge bg="info" pill>
                        {account.useCount} {account.useCount === 1 ? 'uso' : 'usos'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">Beneficiario</small>
                    <div><strong>{account.beneficiaryName}</strong></div>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">Banco</small>
                    <div>{account.bank}</div>
                  </div>
                  
                  <div className="mb-2">
                    <small className="text-muted">Cuenta</small>
                    <div className="font-monospace">
                      {account.accountType === 'ahorro' ? 'Ahorro' : 'Corriente'} - 
                      {' '}****{account.accountNumber.slice(-4)}
                    </div>
                  </div>
                  
                  {account.lastUsed && (
                    <div className="mb-3">
                      <small className="text-muted">
                        Última vez: {new Date(account.lastUsed).toLocaleDateString('es-CL')}
                      </small>
                    </div>
                  )}
                  
                  <div className="d-flex gap-2">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      className="flex-grow-1"
                      onClick={() => openEditModal(account)}
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <div className="mt-4">
        <Button variant="outline-secondary" onClick={() => navigate('/app')}>
          ← Volver al Inicio
        </Button>
      </div>

      {/* Add Account Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Agregar Nueva Cuenta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre para identificar esta cuenta *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Mi cuenta principal, Cuenta de mamá..."
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>
          
          <VenezuelanBankDetailsForm
            bankDetails={bankDetails}
            onChange={setBankDetails}
            errors={{}}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddAccount} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar Cuenta'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Account Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Editar Cuenta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nombre para identificar esta cuenta *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Mi cuenta principal, Cuenta de mamá..."
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              disabled={submitting}
            />
          </Form.Group>
          
          <VenezuelanBankDetailsForm
            bankDetails={bankDetails}
            onChange={setBankDetails}
            errors={{}}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleEditAccount} disabled={submitting}>
            {submitting ? 'Guardando...' : 'Actualizar Cuenta'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
