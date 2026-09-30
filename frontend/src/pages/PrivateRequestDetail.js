import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Spinner, Alert, ListGroup, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', variant: 'secondary', icon: 'bi-send-check', color: '#6c757d' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'primary', icon: 'bi-search', color: '#3b82f6' },
  FOUND: { label: 'Item Matched / Found', variant: 'info', icon: 'bi-patch-check', color: '#06b6d4' },
  READY_FOR_COLLECTION: { label: 'Ready for Collection', variant: 'warning', icon: 'bi-box-seam', color: '#f59e0b' },
  RETURNED: { label: 'Returned & Closed', variant: 'success', icon: 'bi-check-circle-fill', color: '#10b981' },
  REJECTED: { label: 'Not Found / Closed', variant: 'danger', icon: 'bi-x-circle', color: '#ef4444' }
};

const PrivateRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Staff action form state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [depositLocation, setDepositLocation] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [studentMessage, setStudentMessage] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/items/private/${id}`);
      setItem(res.data);
      setNewStatus(res.data.privateStatus);
      setDepositLocation(res.data.depositLocation || '');
      setStaffNote(res.data.staffNote || '');
      setStudentMessage(res.data.studentMessage || '');
    } catch (err) {
      console.error('Fetch private item detail error:', err);
      setError(err.response?.data?.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await api.put(`/items/private/${id}/status`, {
        status: newStatus,
        note: statusNote,
        depositLocation,
        staffNote,
        studentMessage
      });
      setItem(res.data.item);
      toast.success(res.data.message || 'Status updated successfully');
      setShowStatusModal(false);
      setStatusNote('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await api.put(`/items/private/${id}/notes`, {
        staffNote,
        studentMessage
      });
      setItem(res.data.item);
      toast.success('Notes saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  const isStaff = user?.userType === 'staff';

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading confidential request...</p>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="p-4 rounded-4 text-center">
          <i className="bi bi-shield-x fs-1 d-block mb-2"></i>
          <h4>Access Denied or Request Not Found</h4>
          <p>{error || 'This request may have been removed or you may not have permission to view it.'}</p>
          <Button variant="primary" onClick={() => navigate(isStaff ? '/staff/private-dashboard' : '/my-items')}>
            Return to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  const currentStatusConfig = STATUS_CONFIG[item.privateStatus] || STATUS_CONFIG.SUBMITTED;

  return (
    <div className="private-detail-page py-4">
      <Container>
        {/* Navigation Breadcrumb / Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <div>
            <Button
              variant="link"
              className="text-decoration-none p-0 text-muted mb-2 d-inline-flex align-items-center gap-1"
              onClick={() => navigate(isStaff ? '/staff/private-dashboard' : '/my-items')}
            >
              <i className="bi bi-arrow-left"></i>
              Back to {isStaff ? 'Staff Dashboard' : 'My Items'}
            </Button>
            <div className="d-flex align-items-center gap-2">
              <h2 className="mb-0 fw-bold">{item.itemName}</h2>
              <Badge bg="dark" className="px-2 py-1 fs-7">
                <i className="bi bi-shield-lock-fill me-1 text-warning"></i>
                Private Record
              </Badge>
            </div>
          </div>

          <div className="mt-3 mt-md-0 d-flex gap-2">
            <Badge
              bg={currentStatusConfig.variant}
              className="px-3 py-2 fs-6 rounded-pill d-flex align-items-center gap-2"
            >
              <i className={`bi ${currentStatusConfig.icon}`}></i>
              {currentStatusConfig.label}
            </Badge>

            {isStaff && (
              <Button variant="primary" onClick={() => setShowStatusModal(true)}>
                <i className="bi bi-sliders me-1"></i>
                Update Status
              </Button>
            )}
          </div>
        </div>

        <Row className="g-4">
          {/* Main Info */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-white py-3 px-4 border-bottom">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  Item Description & Details
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-4">
                  <h6 className="text-muted text-uppercase fs-7 fw-bold">General Description</h6>
                  <p className="fs-6">{item.description}</p>
                </div>

                <Row className="g-3 mb-4">
                  <Col sm={6}>
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted d-block fs-7">Category</span>
                      <strong className="text-capitalize">{item.category}</strong>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted d-block fs-7">Approximate Value</span>
                      <strong>{item.estimatedValue || 'Not specified'}</strong>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted d-block fs-7">Date & Time Reported</span>
                      <strong>{new Date(item.foundDate).toLocaleDateString()} at {item.foundTime}</strong>
                    </div>
                  </Col>
                  <Col sm={6}>
                    <div className="p-3 bg-light rounded-3">
                      <span className="text-muted d-block fs-7">Location of Loss/Find</span>
                      <strong>{item.foundLocation}</strong>
                    </div>
                  </Col>
                </Row>

                {item.identifyingCharacteristics && (
                  <div className="p-3 bg-primary-subtle text-dark rounded-3 mb-4 border-start border-4 border-primary">
                    <h6 className="fw-bold mb-1 text-primary">
                      <i className="bi bi-fingerprint me-2"></i>
                      Identifying Characteristics (Confidential)
                    </h6>
                    <p className="mb-0 fs-7">{item.identifyingCharacteristics}</p>
                  </div>
                )}

                {item.additionalNotes && (
                  <div className="mb-4">
                    <h6 className="text-muted text-uppercase fs-7 fw-bold">Additional Notes from Requester</h6>
                    <p className="text-secondary fs-7">{item.additionalNotes}</p>
                  </div>
                )}

                {item.imageUrl && (
                  <div className="mt-4">
                    <h6 className="text-muted text-uppercase fs-7 fw-bold mb-2">Attached Image</h6>
                    <div className="border rounded-3 p-2 d-inline-block bg-light">
                      <img
                        src={`http://localhost:5000${item.imageUrl}`}
                        alt={item.itemName}
                        className="rounded img-fluid"
                        style={{ maxHeight: '300px', objectFit: 'cover' }}
                      />
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Audit Trail & History */}
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Header className="bg-white py-3 px-4 border-bottom">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-clock-history me-2 text-primary"></i>
                  Verification & Status Timeline
                </h5>
              </Card.Header>
              <Card.Body className="p-4">
                {item.statusHistory && item.statusHistory.length > 0 ? (
                  <div className="timeline-container">
                    {item.statusHistory.map((history, idx) => {
                      const cfg = STATUS_CONFIG[history.status] || STATUS_CONFIG.SUBMITTED;
                      return (
                        <div key={idx} className="timeline-item d-flex gap-3 mb-3 pb-3 border-bottom">
                          <div
                            className="timeline-icon rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: '38px',
                              height: '38px',
                              backgroundColor: `${cfg.color}15`,
                              color: cfg.color
                            }}
                          >
                            <i className={`bi ${cfg.icon}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong style={{ color: cfg.color }}>{cfg.label}</strong>
                              <span className="text-muted fs-7">
                                {new Date(history.changedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="mb-0 text-secondary fs-7">{history.note || 'Status updated'}</p>
                            {history.changedBy && (
                              <small className="text-muted d-block mt-1">
                                By: {history.changedBy.name} ({history.changedBy.userType})
                              </small>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted mb-0">No timeline events recorded yet.</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar / Actions / Staff Section */}
          <Col lg={4}>
            {/* Requester Profile Card (visible to staff) */}
            {isStaff && item.uploadedBy && (
              <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Header className="bg-white py-3 px-4 border-bottom">
                  <h6 className="mb-0 fw-bold">
                    <i className="bi bi-person-badge me-2 text-primary"></i>
                    Requester Information
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: '45px', height: '45px', fontSize: '1.2rem' }}
                    >
                      {item.uploadedBy.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">{item.uploadedBy.name}</h6>
                      <small className="text-muted text-capitalize">{item.uploadedBy.userType}</small>
                    </div>
                  </div>
                  <ListGroup variant="flush" className="fs-7">
                    <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                      <span className="text-muted">Email:</span>
                      <strong>{item.uploadedBy.email}</strong>
                    </ListGroup.Item>
                    {item.uploadedBy.rollNumber && (
                      <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                        <span className="text-muted">Roll Number:</span>
                        <strong>{item.uploadedBy.rollNumber}</strong>
                      </ListGroup.Item>
                    )}
                    {item.uploadedBy.department && (
                      <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                        <span className="text-muted">Department:</span>
                        <strong>{item.uploadedBy.department}</strong>
                      </ListGroup.Item>
                    )}
                    {item.uploadedBy.phone && (
                      <ListGroup.Item className="px-0 py-2 d-flex justify-content-between">
                        <span className="text-muted">Phone:</span>
                        <strong>{item.uploadedBy.phone}</strong>
                      </ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}

            {/* Staff Internal Notes & Communication */}
            {isStaff ? (
              <Card className="border-0 shadow-sm rounded-4 mb-4">
                <Card.Header className="bg-white py-3 px-4 border-bottom">
                  <h6 className="mb-0 fw-bold">
                    <i className="bi bi-journal-text me-2 text-warning"></i>
                    Staff Controls & Notes
                  </h6>
                </Card.Header>
                <Card.Body className="p-4">
                  <Form onSubmit={handleUpdateNotes}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fs-7 fw-bold text-dark">
                        <i className="bi bi-lock me-1"></i>
                        Internal Staff Note (Confidential to Staff)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={staffNote}
                        onChange={(e) => setStaffNote(e.target.value)}
                        placeholder="Log internal details: locker #, verification observations, police memo..."
                        className="fs-7"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fs-7 fw-bold text-dark">
                        <i className="bi bi-chat-left-text me-1"></i>
                        Message to Student (Visible to Requester)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={studentMessage}
                        onChange={(e) => setStudentMessage(e.target.value)}
                        placeholder="e.g., Please visit Admin Office room 104 with your student ID."
                        className="fs-7"
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="outline-primary"
                      size="sm"
                      className="w-100"
                      disabled={updating}
                    >
                      {updating ? <Spinner size="sm" animation="border" /> : 'Save Notes'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            ) : (
              /* Student Guidance Card */
              <Card className="border-0 shadow-sm rounded-4 mb-4 bg-primary text-white">
                <Card.Body className="p-4">
                  <h6 className="fw-bold mb-3">
                    <i className="bi bi-shield-check me-2"></i>
                    Collection & Verification Policy
                  </h6>
                  <p className="fs-7 opacity-90 mb-3">
                    For sensitive and valuable belongings, physical handovers require multi-factor identity verification.
                  </p>
                  <ul className="fs-7 ps-3 mb-0 opacity-90">
                    <li className="mb-1">Bring your physical SIT Student / Staff ID card.</li>
                    <li className="mb-1">Be prepared to unlock the device or present proof of purchase.</li>
                    <li>Sign the physical custody register at the designated office.</li>
                  </ul>
                </Card.Body>
              </Card>
            )}

            {/* Custody Info Card */}
            {item.depositLocation && (
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <h6 className="fw-bold text-muted fs-7 text-uppercase mb-2">Custody Location</h6>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-geo-alt-fill text-danger fs-4"></i>
                    <div>
                      <strong>{item.depositLocation}</strong>
                      <span className="d-block fs-7 text-muted">SIT Nagpur Campus</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>

        {/* Update Status Modal for Staff */}
        <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Update Private Request Status</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleUpdateStatus}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Status *</Form.Label>
                <Form.Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="FOUND">Item Matched / Found</option>
                  <option value="READY_FOR_COLLECTION">Ready for Collection</option>
                  <option value="RETURNED">Returned (Handover Complete)</option>
                  <option value="REJECTED">Not Found / Closed</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Physical Custody / Collection Desk</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Security Main Gate Locker #4"
                  value={depositLocation}
                  onChange={(e) => setDepositLocation(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Status Change Log Note (Audit)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Reason or action taken..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Message to Student</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Will be visible to student on their dashboard..."
                  value={studentMessage}
                  onChange={(e) => setStudentMessage(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updating}>
                {updating ? <Spinner size="sm" animation="border" /> : 'Apply Status Update'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default PrivateRequestDetail;
