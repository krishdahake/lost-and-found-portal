import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Modal, ProgressBar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Submitted',
    variant: 'secondary',
    icon: 'bi-send-check',
    color: '#6c757d',
    step: 1,
    desc: 'Your private request has been submitted securely and is in the staff queue.'
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    variant: 'primary',
    icon: 'bi-search',
    color: '#3b82f6',
    step: 2,
    desc: 'Designated staff is currently cross-checking physical custody logs and matching details.'
  },
  FOUND: {
    label: 'Item Matched / Found',
    variant: 'info',
    icon: 'bi-patch-check',
    color: '#06b6d4',
    step: 3,
    desc: 'A matching valuable item was located in secure custody. Verification in progress.'
  },
  READY_FOR_COLLECTION: {
    label: 'Ready for Collection',
    variant: 'warning',
    icon: 'bi-box-seam',
    color: '#f59e0b',
    step: 4,
    desc: 'Item is verified! Please visit the designated desk with your valid SIT ID.'
  },
  RETURNED: {
    label: 'Returned & Closed',
    variant: 'success',
    icon: 'bi-check-circle-fill',
    color: '#10b981',
    step: 5,
    desc: 'Item has been successfully handed over to you. Case resolved.'
  },
  REJECTED: {
    label: 'Not Found / Closed',
    variant: 'danger',
    icon: 'bi-x-circle',
    color: '#ef4444',
    step: 0,
    desc: 'No matching item was verified after review. Contact staff for details.'
  }
};

const MyPrivateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items/private/my-requests');
      setRequests(res.data.items || []);
    } catch (err) {
      console.error('Fetch private requests error:', err);
      setError('Unable to load your private requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelModalItem) return;
    try {
      setCancelling(true);
      await api.delete(`/items/private/${cancelModalItem._id}`);
      setRequests(requests.filter(r => r._id !== cancelModalItem._id));
      toast.success('Private request cancelled successfully');
      setCancelModalItem(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const getStepPercentage = (status) => {
    const config = STATUS_CONFIG[status];
    if (!config || config.step === 0) return 0;
    return (config.step / 5) * 100;
  };

  return (
    <div className="private-requests-page py-4">
      <Container>
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="mb-0 fw-bold">My Private & Valuable Requests</h2>
              <Badge bg="dark" className="px-2 py-1 fs-7">
                <i className="bi bi-shield-lock-fill me-1 text-warning"></i>
                Confidential
              </Badge>
            </div>
            <p className="text-muted mb-0">
              High-value items reported directly to SIT staff without public exposure.
            </p>
          </div>
          <div className="mt-2 mt-md-0">
            <Button as={Link} to="/upload" variant="primary" className="d-flex align-items-center gap-2">
              <i className="bi bi-plus-circle"></i>
              Report New Item
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading your secure requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <Card className="text-center p-5 shadow-sm border-0 rounded-4">
            <Card.Body>
              <div className="mb-3 text-muted" style={{ fontSize: '3.5rem' }}>
                <i className="bi bi-shield-check"></i>
              </div>
              <h4>No Private Requests Found</h4>
              <p className="text-muted max-w-md mx-auto mb-4">
                You haven't submitted any confidential or high-value item reports yet. 
                When you lose or find valuable items (laptops, wallets, gold, official IDs), submit them securely here.
              </p>
              <Button as={Link} to="/upload" variant="primary">
                Submit a Private Item Report
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {requests.map(item => {
              const statusInfo = STATUS_CONFIG[item.privateStatus] || STATUS_CONFIG.SUBMITTED;
              const percent = getStepPercentage(item.privateStatus);

              return (
                <Col key={item._id} xs={12}>
                  <Card className="border-0 shadow-sm rounded-4 overflow-hidden private-request-card">
                    <Card.Header className="bg-white border-bottom py-3 px-4 d-flex flex-wrap justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary-subtle text-secondary text-uppercase fw-semibold px-2 py-1">
                          {item.category}
                        </span>
                        <h5 className="mb-0 fw-bold">{item.itemName}</h5>
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
                        <Badge
                          bg={statusInfo.variant}
                          className="px-3 py-2 d-flex align-items-center gap-1 fs-6 rounded-pill"
                        >
                          <i className={`bi ${statusInfo.icon}`}></i>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </Card.Header>

                    <Card.Body className="p-4">
                      {/* Timeline Progress Bar */}
                      {item.privateStatus !== 'REJECTED' && (
                        <div className="mb-4">
                          <div className="d-flex justify-content-between text-muted fs-7 mb-2">
                            <span className={item.privateStatus === 'SUBMITTED' ? 'fw-bold text-primary' : ''}>1. Submitted</span>
                            <span className={item.privateStatus === 'UNDER_REVIEW' ? 'fw-bold text-primary' : ''}>2. In Review</span>
                            <span className={item.privateStatus === 'FOUND' ? 'fw-bold text-primary' : ''}>3. Matched</span>
                            <span className={item.privateStatus === 'READY_FOR_COLLECTION' ? 'fw-bold text-primary' : ''}>4. Ready</span>
                            <span className={item.privateStatus === 'RETURNED' ? 'fw-bold text-success' : ''}>5. Returned</span>
                          </div>
                          <ProgressBar
                            now={percent}
                            variant={item.privateStatus === 'RETURNED' ? 'success' : 'primary'}
                            style={{ height: '8px' }}
                            animated={item.privateStatus !== 'RETURNED'}
                          />
                        </div>
                      )}

                      <Row className="g-3">
                        <Col md={8}>
                          <p className="text-secondary mb-2">{item.description}</p>
                          
                          {item.identifyingCharacteristics && (
                            <div className="p-3 bg-light rounded-3 mb-3 border-start border-3 border-primary">
                              <strong className="text-dark d-block mb-1 fs-7">
                                <i className="bi bi-fingerprint me-1 text-primary"></i>
                                Private Identifying Marks / Serial:
                              </strong>
                              <span className="text-muted fs-7">{item.identifyingCharacteristics}</span>
                            </div>
                          )}

                          {item.studentMessage && (
                            <div className="p-3 bg-warning-subtle text-dark rounded-3 mb-3 border-start border-3 border-warning">
                              <strong className="d-block mb-1 fs-7">
                                <i className="bi bi-chat-left-dots-fill me-1 text-warning"></i>
                                Message from SIT Staff:
                              </strong>
                              <span className="fs-7">{item.studentMessage}</span>
                            </div>
                          )}

                          <div className="d-flex flex-wrap gap-3 text-muted fs-7">
                            <div>
                              <i className="bi bi-geo-alt me-1 text-danger"></i>
                              <strong>Lost/Found Area:</strong> {item.foundLocation}
                            </div>
                            <div>
                              <i className="bi bi-calendar-event me-1 text-primary"></i>
                              <strong>Date:</strong> {new Date(item.foundDate).toLocaleDateString()} at {item.foundTime}
                            </div>
                            {item.estimatedValue && (
                              <div>
                                <i className="bi bi-cash-stack me-1 text-success"></i>
                                <strong>Est. Value:</strong> {item.estimatedValue}
                              </div>
                            )}
                            {item.depositLocation && (
                              <div>
                                <i className="bi bi-building me-1 text-info"></i>
                                <strong>Custody Location:</strong> {item.depositLocation}
                              </div>
                            )}
                          </div>
                        </Col>

                        <Col md={4} className="d-flex flex-column justify-content-between align-items-md-end border-start-md ps-md-4">
                          <div className="text-md-end w-100">
                            <div className="alert alert-light border py-2 px-3 fs-7 mb-3 text-start">
                              <i className="bi bi-info-circle me-1 text-primary"></i>
                              {statusInfo.desc}
                            </div>
                          </div>

                          <div className="d-flex flex-wrap gap-2 justify-content-md-end w-100 mt-2">
                            <Button
                              as={Link}
                              to={`/private-requests/${item._id}`}
                              variant="outline-primary"
                              size="sm"
                              className="d-flex align-items-center gap-1"
                            >
                              <i className="bi bi-eye"></i>
                              Full Details & Timeline
                            </Button>

                            {item.privateStatus === 'SUBMITTED' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => setCancelModalItem(item)}
                              >
                                <i className="bi bi-x-circle me-1"></i>
                                Cancel Request
                              </Button>
                            )}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Cancel Confirmation Modal */}
        <Modal show={!!cancelModalItem} onHide={() => setCancelModalItem(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Cancel Private Request</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to cancel the request for <strong>{cancelModalItem?.itemName}</strong>?
            This will remove the item from the staff review queue.
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setCancelModalItem(null)} disabled={cancelling}>
              Keep Request
            </Button>
            <Button variant="danger" onClick={handleCancelRequest} disabled={cancelling}>
              {cancelling ? <Spinner size="sm" animation="border" /> : 'Yes, Cancel Request'}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default MyPrivateRequests;
