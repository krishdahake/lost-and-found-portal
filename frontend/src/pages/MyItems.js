import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Tabs, Tab, Badge, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const STATUS_BADGES = {
  available: { label: 'Available', bg: 'success' },
  claimed: { label: 'Claimed', bg: 'warning' },
  returned: { label: 'Returned', bg: 'info' }
};

const PRIVATE_STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', bg: 'secondary', icon: 'bi-send' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'primary', icon: 'bi-search' },
  FOUND: { label: 'Item Matched', bg: 'info', icon: 'bi-patch-check' },
  READY_FOR_COLLECTION: { label: 'Ready for Collection', bg: 'warning', icon: 'bi-box-seam' },
  RETURNED: { label: 'Returned & Closed', bg: 'success', icon: 'bi-check-circle' },
  REJECTED: { label: 'Closed', bg: 'danger', icon: 'bi-x-circle' }
};

const MyItems = () => {
    const [key, setKey] = useState('public');
    const [publicItems, setPublicItems] = useState([]);
    const [privateItems, setPrivateItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAllMyItems();
    }, []);

    const fetchAllMyItems = async () => {
        try {
            setLoading(true);
            const [pubRes, privRes] = await Promise.all([
                api.get('/items/user/my-items'),
                api.get('/items/private/my-requests')
            ]);
            setPublicItems(pubRes.data.items || []);
            setPrivateItems(privRes.data.items || []);
        } catch (err) {
            console.error('Error fetching my items:', err);
            setError('Failed to fetch your items');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePublic = async (id) => {
        if (!window.confirm('Are you sure you want to delete this public report?')) return;
        try {
            await api.delete(`/items/${id}`);
            setPublicItems(publicItems.filter(item => item._id !== id));
            toast.success('Report deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete item');
        }
    };

    const handleStatusUpdatePublic = async (id, newStatus) => {
        try {
            await api.put(`/items/${id}`, { status: newStatus });
            setPublicItems(publicItems.map(item => item._id === id ? { ...item, status: newStatus } : item));
            toast.success('Status updated');
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDeletePrivate = async (id) => {
        if (!window.confirm('Cancel this private request?')) return;
        try {
            await api.delete(`/items/private/${id}`);
            setPrivateItems(privateItems.filter(item => item._id !== id));
            toast.success('Private request cancelled');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to cancel request');
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading your items...</p>
            </Container>
        );
    }

    return (
        <div className="my-items-page py-4">
            <Container>
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
                    <div>
                        <h2 className="mb-1 fw-bold">My Reported Items</h2>
                        <p className="text-muted mb-0">Manage your public lost & found posts and track confidential requests.</p>
                    </div>
                    <Button as={Link} to="/upload" variant="primary" className="mt-2 mt-sm-0">
                        <i className="bi bi-plus-circle me-1"></i>
                        Report New Item
                    </Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Tabs
                    activeKey={key}
                    onSelect={(k) => setKey(k)}
                    className="mb-4 custom-tabs"
                >
                    <Tab 
                        eventKey="public" 
                        title={
                            <span className="d-flex align-items-center gap-2">
                                <i className="bi bi-globe"></i>
                                Public Items
                                <Badge bg="primary" pill>{publicItems.length}</Badge>
                            </span>
                        }
                    >
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <Card.Body className="p-0">
                                {publicItems.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="bi bi-box-seam fs-1 text-muted d-block mb-2"></i>
                                        <h5>No public items reported yet</h5>
                                        <p className="text-muted">Found something on campus? Report it to help its owner.</p>
                                        <Button as={Link} to="/upload" variant="primary" size="sm">
                                            Report Public Item
                                        </Button>
                                    </div>
                                ) : (
                                    <Table responsive hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Item</th>
                                                <th>Category</th>
                                                <th>Found Location & Date</th>
                                                <th>Deposit Location</th>
                                                <th>Status</th>
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {publicItems.map(item => (
                                                <tr key={item._id}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center gap-3">
                                                            {item.imageUrl ? (
                                                                <img
                                                                    src={`http://localhost:5000${item.imageUrl}`}
                                                                    alt={item.itemName}
                                                                    className="rounded-3"
                                                                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div className="rounded-3 bg-light d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                                                                    <i className="bi bi-image text-muted"></i>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <Link to={`/items/${item._id}`} className="fw-bold text-dark text-decoration-none">
                                                                    {item.itemName}
                                                                </Link>
                                                                <small className="d-block text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                                                    {item.description}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-secondary-subtle text-secondary text-uppercase fs-8">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="fs-7 d-block">{item.foundLocation}</span>
                                                        <small className="text-muted">{new Date(item.foundDate).toLocaleDateString()}</small>
                                                    </td>
                                                    <td>
                                                        <span className="fs-7 text-muted">{item.depositLocation || '—'}</span>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={item.status}
                                                            onChange={(e) => handleStatusUpdatePublic(item._id, e.target.value)}
                                                            style={{ width: '130px' }}
                                                        >
                                                            <option value="available">Available</option>
                                                            <option value="claimed">Claimed</option>
                                                            <option value="returned">Returned</option>
                                                        </select>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <div className="d-inline-flex gap-2">
                                                            <Button
                                                                as={Link}
                                                                to={`/items/${item._id}`}
                                                                variant="outline-primary"
                                                                size="sm"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </Button>
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                onClick={() => handleDeletePublic(item._id)}
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>

                    <Tab 
                        eventKey="private" 
                        title={
                            <span className="d-flex align-items-center gap-2">
                                <i className="bi bi-shield-lock-fill text-warning"></i>
                                Private / Valuable Requests
                                <Badge bg="warning" text="dark" pill>{privateItems.length}</Badge>
                            </span>
                        }
                    >
                        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
                            <Card.Body className="p-0">
                                {privateItems.length === 0 ? (
                                    <div className="text-center py-5">
                                        <i className="bi bi-shield-check fs-1 text-muted d-block mb-2"></i>
                                        <h5>No confidential requests</h5>
                                        <p className="text-muted">High-value items reported confidentially to SIT staff will appear here.</p>
                                        <Button as={Link} to="/upload" variant="warning" size="sm">
                                            Report Private Item
                                        </Button>
                                    </div>
                                ) : (
                                    <Table responsive hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Private Item</th>
                                                <th>Category</th>
                                                <th>Reported Date</th>
                                                <th>Status</th>
                                                <th>Staff Update / Notes</th>
                                                <th className="text-end pe-4">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {privateItems.map(item => {
                                                const pConf = PRIVATE_STATUS_CONFIG[item.privateStatus] || PRIVATE_STATUS_CONFIG.SUBMITTED;
                                                return (
                                                    <tr key={item._id}>
                                                        <td className="ps-4">
                                                            <div className="d-flex align-items-center gap-3">
                                                                <div className="rounded-3 bg-warning-subtle text-dark d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
                                                                    <i className="bi bi-shield-lock-fill fs-5"></i>
                                                                </div>
                                                                <div>
                                                                    <strong className="d-block text-dark">{item.itemName}</strong>
                                                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '220px' }}>
                                                                        {item.description}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-secondary text-uppercase fs-8 border">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="fs-7 d-block">{new Date(item.foundDate).toLocaleDateString()}</span>
                                                            <small className="text-muted">{item.foundTime}</small>
                                                        </td>
                                                        <td>
                                                            <Badge bg={pConf.bg} className="px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1">
                                                                <i className={`bi ${pConf.icon}`}></i>
                                                                {pConf.label}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            {item.studentMessage ? (
                                                                <span className="text-dark fs-7 d-block text-truncate" style={{ maxWidth: '220px' }}>
                                                                    <i className="bi bi-chat-quote-fill text-warning me-1"></i>
                                                                    {item.studentMessage}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted fs-8">In staff queue</span>
                                                            )}
                                                        </td>
                                                        <td className="text-end pe-4">
                                                            <div className="d-inline-flex gap-2">
                                                                <Button
                                                                    as={Link}
                                                                    to={`/private-requests/${item._id}`}
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                >
                                                                    <i className="bi bi-eye me-1"></i>
                                                                    Timeline
                                                                </Button>
                                                                {item.privateStatus === 'SUBMITTED' && (
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleDeletePrivate(item._id)}
                                                                    >
                                                                        <i className="bi bi-x-circle"></i>
                                                                    </Button>
                                                                )}
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
                    </Tab>
                </Tabs>
            </Container>
        </div>
    );
};

export default MyItems;
