import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Table, Spinner, Alert, Modal, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', variant: 'secondary', icon: 'bi-send-check', color: '#6c757d' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'primary', icon: 'bi-search', color: '#3b82f6' },
  FOUND: { label: 'Item Matched', variant: 'info', icon: 'bi-patch-check', color: '#06b6d4' },
  READY_FOR_COLLECTION: { label: 'Ready for Pickup', variant: 'warning', icon: 'bi-box-seam', color: '#f59e0b' },
  RETURNED: { label: 'Returned', variant: 'success', icon: 'bi-check-circle-fill', color: '#10b981' },
  REJECTED: { label: 'Closed / Rejected', variant: 'danger', icon: 'bi-x-circle', color: '#ef4444' }
};

const StaffPrivateDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    TOTAL: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    FOUND: 0,
    READY_FOR_COLLECTION: 0,
    RETURNED: 0,
    REJECTED: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Status Update Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalStatus, setModalStatus] = useState('SUBMITTED');
  const [modalNote, setModalNote] = useState('');
  const [modalStudentMsg, setModalStudentMsg] = useState('');
  const [modalDepositLoc, setModalDepositLoc] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user && user.userType !== 'staff') {
      toast.error('Access restricted to SIT Staff');
      navigate('/home');
      return;
    }
    fetchPrivateItems();
  }, [user, selectedStatus, selectedCategory]);

  const fetchPrivateItems = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/items/private/staff/all', { params });
      setItems(res.data.items || []);
      if (res.data.counts) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Fetch staff private items error:', err);
      setError('Failed to load private items. Make sure you are logged in as staff.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPrivateItems();
  };

  const openStatusModal = (item) => {
    setSelectedItem(item);
    setModalStatus(item.privateStatus);
    setModalNote('');
    setModalStudentMsg(item.studentMessage || '');
    setModalDepositLoc(item.depositLocation || '');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setUpdating(true);
      const res = await api.put(`/items/private/${selectedItem._id}/status`, {
        status: modalStatus,
        note: modalNote,
        studentMessage: modalStudentMsg,
        depositLocation: modalDepositLoc
      });

      toast.success(res.data.message || 'Status updated successfully');
      setSelectedItem(null);
      fetchPrivateItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="staff-dashboard-page py-4">
      <Container fluid className="px-md-5">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="mb-0 fw-bold">Staff Private & Valuable Item Management</h2>
              <Badge bg="danger" className="px-2 py-1 fs-7">
                <i className="bi bi-shield-lock-fill me-1"></i>
                Staff Only
              </Badge>
            </div>
            <p className="text-muted mb-0">
              Review and securely verify high-value reported items, update statuses, and log student handovers.
            </p>
          </div>
          <div className="mt-2 mt-md-0 d-flex gap-2">
            <Button variant="outline-secondary" onClick={fetchPrivateItems} className="d-flex align-items-center gap-1">
              <i className="bi bi-arrow-clockwise"></i>
              Refresh
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Status Metrics Counters */}
        <Row className="g-3 mb-4">
          <Col xs={6} md={4} lg={2}>
            <Card
              className={`border-0 shadow-sm rounded-4 cursor-pointer text-center p-3 h-100 ${selectedStatus === 'ALL' ? 'border border-2 border-dark' : ''}`}
              onClick={() => setSelectedStatus('ALL')}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-muted fs-7 fw-bold text-uppercase">Total Requests</span>
              <h3 className="fw-bold mb-0 text-dark mt-1">{counts.TOTAL}</h3>
            </Card>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <Card
              className={`border-0 shadow-sm rounded-4 cursor-pointer text-center p-3 h-100 ${selectedStatus === 'SUBMITTED' ? 'border border-2 border-secondary' : ''}`}
              onClick={() => setSelectedStatus('SUBMITTED')}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-secondary fs-7 fw-bold text-uppercase">Submitted</span>
              <h3 className="fw-bold mb-0 text-secondary mt-1">{counts.SUBMITTED}</h3>
            </Card>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <Card
              className={`border-0 shadow-sm rounded-4 cursor-pointer text-center p-3 h-100 ${selectedStatus === 'UNDER_REVIEW' ? 'border border-2 border-primary' : ''}`}
              onClick={() => setSelectedStatus('UNDER_REVIEW')}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-primary fs-7 fw-bold text-uppercase">In Review</span>
              <h3 className="fw-bold mb-0 text-primary mt-1">{counts.UNDER_REVIEW}</h3>
            </Card>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <Card
              className={`border-0 shadow-sm rounded-4 cursor-pointer text-center p-3 h-100 ${selectedStatus === 'FOUND' ? 'border border-2 border-info' : ''}`}
              onClick={() => setSelectedStatus('FOUND')}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-info fs-7 fw-bold text-uppercase">Matched</span>
              <h3 className="fw-bold mb-0 text-info mt-1">{counts.FOUND}</h3>
            </Card>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <Card
              className={`border-0 shadow-sm rounded-4 cursor-pointer text-center p-3 h-100 ${selectedStatus === 'READY_FOR_COLLECTION' ? 'border border-2 border-warning' : ''}`}
              onClick={() => setSelectedStatus('READY_FOR_COLLECTION')}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-warning fs-7 fw-bold text-uppercase">Ready</span>
              <h3 className="fw-bold mb-0 text-warning mt-1">{counts.READY_FOR_COLLECTION}</h3>
            </Card>
          </Col>
          <Col xs={6} md={4} lg={2}>
            <Card
              className={`border-0 shadow-sm rounded-4 cursor-pointer text-center p-3 h-100 ${selectedStatus === 'RETURNED' ? 'border border-2 border-success' : ''}`}
              onClick={() => setSelectedStatus('RETURNED')}
              style={{ cursor: 'pointer' }}
            >
              <span className="text-success fs-7 fw-bold text-uppercase">Returned</span>
              <h3 className="fw-bold mb-0 text-success mt-1">{counts.RETURNED}</h3>
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm rounded-4 mb-4">
          <Card.Body className="p-3">
            <Form onSubmit={handleSearchSubmit}>
              <Row className="g-3 align-items-center">
                <Col md={5}>
                  <InputGroup>
                    <InputGroup.Text className="bg-white border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by item, characteristics, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-start-0"
                    />
                    <Button variant="primary" type="submit">
                      Search
                    </Button>
                  </InputGroup>
                </Col>

                <Col md={3}>
                  <Form.Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="FOUND">Item Matched</option>
                    <option value="READY_FOR_COLLECTION">Ready for Collection</option>
                    <option value="RETURNED">Returned</option>
                    <option value="REJECTED">Closed / Rejected</option>
                  </Form.Select>
                </Col>

                <Col md={3}>
                  <Form.Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="documents">Documents</option>
                    <option value="accessories">Accessories</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                    <option value="others">Others</option>
                  </Form.Select>
                </Col>

                <Col md={1} className="text-end">
                  <Button
                    variant="outline-secondary"
                    className="w-100"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStatus('ALL');
                      setSelectedCategory('ALL');
                    }}
                  >
                    Reset
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {/* Requests Table */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading private requests...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                <h5>No private requests match the criteria</h5>
                <p className="text-muted">Try clearing the search query or status filter.</p>
              </div>
            ) : (
              <Table responsive hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4">Item & Category</th>
                    <th>Requester</th>
                    <th>Reported Date</th>
                    <th>Location / Custody</th>
                    <th>Status</th>
                    <th className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const statusInfo = STATUS_CONFIG[item.privateStatus] || STATUS_CONFIG.SUBMITTED;

                    return (
                      <tr key={item._id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-3 d-flex align-items-center justify-content-center bg-light text-primary flex-shrink-0"
                              style={{ width: '42px', height: '42px', fontSize: '1.2rem' }}
                            >
                              <i className="bi bi-shield-lock"></i>
                            </div>
                            <div>
                              <strong className="d-block text-dark">{item.itemName}</strong>
                              <span className="badge bg-light text-secondary text-uppercase fs-8 border">
                                {item.category}
                              </span>
                              {item.estimatedValue && (
                                <small className="text-muted ms-2">Val: {item.estimatedValue}</small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <strong className="d-block fs-7">{item.uploadedBy?.name || 'Unknown'}</strong>
                            <small className="text-muted d-block">{item.uploadedBy?.email}</small>
                            {item.uploadedBy?.rollNumber && (
                              <small className="badge bg-secondary-subtle text-secondary fs-8">
                                {item.uploadedBy.rollNumber}
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="fs-7">{new Date(item.foundDate).toLocaleDateString()}</span>
                          <small className="d-block text-muted">{item.foundTime}</small>
                        </td>

                        <td>
                          <span className="fs-7 d-block">{item.foundLocation}</span>
                          {item.depositLocation ? (
                            <small className="text-success d-flex align-items-center gap-1">
                              <i className="bi bi-geo-alt-fill"></i>
                              {item.depositLocation}
                            </small>
                          ) : (
                            <small className="text-muted">Not assigned</small>
                          )}
                        </td>

                        <td>
                          <Badge
                            bg={statusInfo.variant}
                            className="px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1"
                          >
                            <i className={`bi ${statusInfo.icon}`}></i>
                            {statusInfo.label}
                          </Badge>
                        </td>

                        <td className="text-end pe-4">
                          <div className="d-inline-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openStatusModal(item)}
                            >
                              <i className="bi bi-pencil-square me-1"></i>
                              Status
                            </Button>
                            <Button
                              as={Link}
                              to={`/private-requests/${item._id}`}
                              variant="primary"
                              size="sm"
                            >
                              <i className="bi bi-eye me-1"></i>
                              Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Status Update Modal */}
        <Modal show={!!selectedItem} onHide={() => setSelectedItem(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Manage: {selectedItem?.itemName}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleStatusSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Update Private Status *</Form.Label>
                <Form.Select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  required
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="FOUND">Item Matched / Found</option>
                  <option value="READY_FOR_COLLECTION">Ready for Collection</option>
                  <option value="RETURNED">Returned to Owner</option>
                  <option value="REJECTED">Closed / Rejected</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Custody / Collection Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. Main Gate Security Locker #2"
                  value={modalDepositLoc}
                  onChange={(e) => setModalDepositLoc(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Audit Trail Note</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Verified device serial number with student"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Student Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Notify student with pickup instructions..."
                  value={modalStudentMsg}
                  onChange={(e) => setModalStudentMsg(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updating}>
                {updating ? <Spinner size="sm" animation="border" /> : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default StaffPrivateDashboard;
