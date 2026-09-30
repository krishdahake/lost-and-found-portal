import React, { useState, useRef, useCallback } from 'react';
import { Form, Button, Container, Row, Col, Alert, ProgressBar, Spinner, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const UploadItem = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);
    const [reportType, setReportType] = useState('NORMAL'); // 'NORMAL' or 'PRIVATE'

    const [formData, setFormData] = useState({
        itemName: '',
        description: '',
        foundLocation: '',
        foundDate: '',
        foundTime: '',
        depositLocation: '',
        category: 'others',
        identifyingCharacteristics: '',
        estimatedValue: '',
        additionalNotes: '',
        securityConfirmed: false
    });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const categories = [
        { value: 'electronics', label: 'Electronics', icon: 'bi-laptop', color: '#667eea' },
        { value: 'documents', label: 'Documents', icon: 'bi-file-earmark-text', color: '#11998e' },
        { value: 'accessories', label: 'Accessories', icon: 'bi-watch', color: '#f39c12' },
        { value: 'clothing', label: 'Clothing', icon: 'bi-bag', color: '#e74c3c' },
        { value: 'books', label: 'Books', icon: 'bi-book', color: '#9b59b6' },
        { value: 'others', label: 'Others', icon: 'bi-box', color: '#6c757d' }
    ];

    const depositLocations = [
        'Security Office - Main Gate',
        'Security Office - Back Gate',
        'Library Reception',
        'Admin Building - Ground Floor',
        'Student Affairs Office',
        'Hostel Warden Office',
        'Canteen Counter',
        'Sports Complex Office'
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            toast.error('Please upload a valid image file');
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const validateStep = (step) => {
        switch(step) {
            case 1:
                if (!formData.itemName.trim()) {
                    toast.error('Please enter item name');
                    return false;
                }
                if (!formData.category) {
                    toast.error('Please select a category');
                    return false;
                }
                if (!formData.description.trim()) {
                    toast.error('Please enter description');
                    return false;
                }
                if (reportType === 'PRIVATE' && !formData.identifyingCharacteristics.trim()) {
                    toast.error('Please enter identifying characteristics / serial number for verification');
                    return false;
                }
                return true;
            case 2:
                // For NORMAL items, image is required. For PRIVATE, image is optional.
                if (reportType === 'NORMAL' && !image) {
                    toast.error('Please upload an image for public listing');
                    return false;
                }
                return true;
            case 3:
                if (!formData.foundDate || !formData.foundTime || !formData.foundLocation.trim()) {
                    toast.error('Please fill all location and time details');
                    return false;
                }
                if (reportType === 'NORMAL' && !formData.depositLocation.trim()) {
                    toast.error('Please select a deposit location');
                    return false;
                }
                if (reportType === 'PRIVATE' && !formData.securityConfirmed) {
                    toast.error('Please confirm that you understand this report is private and handled by SIT Staff');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        try {
            setLoading(true);
            setError('');
            setUploadProgress(0);

            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });
            if (image) {
                data.append('image', image);
            }

            if (reportType === 'PRIVATE') {
                // Submit to private items endpoint
                await api.post('/items/private', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                });

                addNotification({
                    type: 'upload',
                    title: 'Private Request Submitted',
                    message: `Your confidential report for "${formData.itemName}" was sent directly to SIT Staff.`
                });

                toast.success('🔒 Confidential report submitted! Staff will review shortly.');
                navigate('/my-private-requests');
            } else {
                // Submit to normal public endpoint
                await api.post('/items', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                });

                addNotification({
                    type: 'upload',
                    title: 'Item Reported Successfully!',
                    message: `Your found item "${formData.itemName}" has been uploaded and is now visible to others.`
                });

                toast.success('🎉 Item reported successfully!');
                navigate('/home');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload item');
            toast.error(err.response?.data?.message || 'Failed to upload item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-page">
            <Container>
                {/* Header */}
                <div className="upload-header">
                    <div className="upload-header-content">
                        <h1>
                            <i className="bi bi-cloud-upload me-3"></i>
                            Report an Item
                        </h1>
                        <p>Report found items to help reunite belongings with their rightful owners at SIT Nagpur</p>
                    </div>
                </div>

                {/* Report Type Selector */}
                <div className="mb-4">
                    <Row className="g-3 justify-content-center">
                        <Col md={6}>
                            <Card 
                                className={`p-3 border-2 h-100 cursor-pointer rounded-4 transition-all ${reportType === 'NORMAL' ? 'border-primary shadow-sm bg-primary-subtle' : 'border-light-subtle'}`}
                                onClick={() => setReportType('NORMAL')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-start gap-3">
                                    <div className="rounded-circle p-3 bg-primary text-white d-flex align-items-center justify-content-center">
                                        <i className="bi bi-globe fs-4"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h5 className="fw-bold mb-1">Public Lost & Found</h5>
                                            <Form.Check 
                                                type="radio" 
                                                name="reportTypeRadio"
                                                checked={reportType === 'NORMAL'} 
                                                onChange={() => setReportType('NORMAL')}
                                            />
                                        </div>
                                        <p className="text-muted fs-7 mb-0">
                                            Standard items (water bottles, notebooks, chargers, keys). Listed publicly on the Home feed with photo.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </Col>

                        <Col md={6}>
                            <Card 
                                className={`p-3 border-2 h-100 cursor-pointer rounded-4 transition-all ${reportType === 'PRIVATE' ? 'border-warning shadow-sm bg-warning-subtle' : 'border-light-subtle'}`}
                                onClick={() => setReportType('PRIVATE')}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="d-flex align-items-start gap-3">
                                    <div className="rounded-circle p-3 bg-warning text-dark d-flex align-items-center justify-content-center">
                                        <i className="bi bi-shield-lock-fill fs-4"></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h5 className="fw-bold mb-1">
                                                Valuable / Private Request
                                                <span className="badge bg-danger ms-2 fs-8">Secure</span>
                                            </h5>
                                            <Form.Check 
                                                type="radio" 
                                                name="reportTypeRadio"
                                                checked={reportType === 'PRIVATE'} 
                                                onChange={() => setReportType('PRIVATE')}
                                            />
                                        </div>
                                        <p className="text-muted fs-7 mb-0">
                                            High-value items (cash, jewelry, laptops, official IDs). <strong>Not listed publicly</strong>; sent directly to SIT Staff for verification.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>

                {/* Progress Steps */}
                <div className="upload-progress-container">
                    <div className="progress-steps">
                        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                            <div className="step-circle">
                                {currentStep > 1 ? <i className="bi bi-check"></i> : '1'}
                            </div>
                            <span>Item Details</span>
                        </div>
                        <div className={`progress-line ${currentStep > 1 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                            <div className="step-circle">
                                {currentStep > 2 ? <i className="bi bi-check"></i> : '2'}
                            </div>
                            <span>{reportType === 'PRIVATE' ? 'Photo (Optional)' : 'Upload Photo'}</span>
                        </div>
                        <div className={`progress-line ${currentStep > 2 ? 'active' : ''}`}></div>
                        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
                            <div className="step-circle">3</div>
                            <span>Location & Safety</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="danger" className="upload-error">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </Alert>
                )}

                <div className="upload-form-container">
                    <Form onSubmit={handleSubmit}>
                        {/* Step 1: Item Details */}
                        <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                            <div className="step-content">
                                <h3 className="step-title">
                                    <i className="bi bi-box-seam me-2"></i>
                                    {reportType === 'PRIVATE' ? 'Confidential Item Information' : 'Item Information'}
                                </h3>
                                
                                <Form.Group className="mb-4">
                                    <Form.Label className="custom-label">Item Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="itemName"
                                        value={formData.itemName}
                                        onChange={handleChange}
                                        placeholder={reportType === 'PRIVATE' ? "e.g., MacBook Pro 14-inch Space Grey, Gold Ring" : "e.g., Black Samsung Earbuds, Blue Water Bottle"}
                                        className="custom-input"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="custom-label">Category *</Form.Label>
                                    <div className="category-grid-upload">
                                        {categories.map(cat => (
                                            <div
                                                key={cat.value}
                                                className={`category-option ${formData.category === cat.value ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, category: cat.value })}
                                                style={{ '--category-color': cat.color }}
                                            >
                                                <i className={`bi ${cat.icon}`}></i>
                                                <span>{cat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="custom-label">Description *</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Provide clear description of the item"
                                        className="custom-input"
                                    />
                                    <div className="char-count">{formData.description.length}/500 characters</div>
                                </Form.Group>

                                {/* PRIVATE ONLY: Identifying characteristics & estimated value */}
                                {reportType === 'PRIVATE' && (
                                    <>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="custom-label text-primary">
                                                <i className="bi bi-fingerprint me-1"></i>
                                                Private Identifying Characteristics / Serial Number *
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                name="identifyingCharacteristics"
                                                value={formData.identifyingCharacteristics}
                                                onChange={handleChange}
                                                placeholder="e.g. Serial # C02XYZ123, engraving on back 'K.D.', specific lock screen wallpaper, scratched left corner..."
                                                className="custom-input"
                                            />
                                            <small className="text-muted fs-8">
                                                This information is strictly confidential and used by SIT Staff to match claims without public disclosure.
                                            </small>
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="custom-label">
                                                        <i className="bi bi-currency-rupee me-1"></i>
                                                        Approximate Value
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="estimatedValue"
                                                        value={formData.estimatedValue}
                                                        onChange={handleChange}
                                                        placeholder="e.g. ₹50,000 / High Value"
                                                        className="custom-input"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="custom-label">Additional Notes</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="additionalNotes"
                                                        value={formData.additionalNotes}
                                                        onChange={handleChange}
                                                        placeholder="Any extra context for staff"
                                                        className="custom-input"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Image Upload */}
                        <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                            <div className="step-content">
                                <h3 className="step-title">
                                    <i className="bi bi-image me-2"></i>
                                    {reportType === 'PRIVATE' ? 'Upload Image (Optional for Private)' : 'Upload Item Photo *'}
                                </h3>

                                {reportType === 'PRIVATE' && (
                                    <Alert variant="info" className="py-2 fs-7 mb-3">
                                        <i className="bi bi-shield-check me-2"></i>
                                        For sensitive items (like wallets, IDs, or gold), uploading an image is optional to prevent exposing private information.
                                    </Alert>
                                )}
                                
                                <div 
                                    className={`dropzone ${dragActive ? 'drag-active' : ''} ${imagePreview ? 'has-image' : ''}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <div className="image-preview-container">
                                            <img src={imagePreview} alt="Preview" className="image-preview" />
                                            <div className="image-preview-overlay">
                                                <button 
                                                    type="button" 
                                                    className="btn-remove-image"
                                                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                    Remove
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn-change-image"
                                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                >
                                                    <i className="bi bi-arrow-repeat"></i>
                                                    Change
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="dropzone-content">
                                            <div className="dropzone-icon">
                                                <i className="bi bi-cloud-arrow-up"></i>
                                            </div>
                                            <h4>Drag & Drop your image here</h4>
                                            <p>or click to browse</p>
                                            <span className="dropzone-hint">Supports: JPG, PNG, GIF (Max 5MB)</span>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {image && (
                                    <div className="file-info">
                                        <i className="bi bi-file-earmark-image"></i>
                                        <span>{image.name}</span>
                                        <span className="file-size">({(image.size / 1024 / 1024).toFixed(2)} MB)</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 3: Location & Confirmation */}
                        <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
                            <div className="step-content">
                                <h3 className="step-title">
                                    <i className="bi bi-geo-alt me-2"></i>
                                    Location & Verification Details
                                </h3>
                                
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="custom-label">
                                                <i className="bi bi-calendar3 me-1"></i>
                                                Date *
                                            </Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="foundDate"
                                                value={formData.foundDate}
                                                onChange={handleChange}
                                                max={new Date().toISOString().split('T')[0]}
                                                className="custom-input"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="custom-label">
                                                <i className="bi bi-clock me-1"></i>
                                                Time *
                                            </Form.Label>
                                            <Form.Control
                                                type="time"
                                                name="foundTime"
                                                value={formData.foundTime}
                                                onChange={handleChange}
                                                className="custom-input"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="custom-label">
                                        <i className="bi bi-geo me-1"></i>
                                        Location Found / Lost *
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="foundLocation"
                                        value={formData.foundLocation}
                                        onChange={handleChange}
                                        placeholder="e.g., Library 2nd Floor, Seminar Hall, Canteen"
                                        className="custom-input"
                                    />
                                </Form.Group>

                                {reportType === 'NORMAL' ? (
                                    <Form.Group className="mb-4">
                                        <Form.Label className="custom-label">
                                            <i className="bi bi-building me-1"></i>
                                            Deposited At *
                                        </Form.Label>
                                        <Form.Select
                                            name="depositLocation"
                                            value={formData.depositLocation}
                                            onChange={handleChange}
                                            className="custom-input"
                                        >
                                            <option value="">Select deposit location</option>
                                            {depositLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                            <option value="custom">Other (Specify below)</option>
                                        </Form.Select>
                                        {formData.depositLocation === 'custom' && (
                                            <Form.Control
                                                type="text"
                                                name="depositLocation"
                                                placeholder="Enter custom location"
                                                onChange={handleChange}
                                                className="custom-input mt-2"
                                            />
                                        )}
                                    </Form.Group>
                                ) : (
                                    <div className="p-3 bg-warning-subtle rounded-3 mb-4 border-start border-4 border-warning">
                                        <h6 className="fw-bold mb-2 text-dark">
                                            <i className="bi bi-shield-check me-2"></i>
                                            Valuable Item Protocol
                                        </h6>
                                        <p className="fs-7 text-dark mb-3">
                                            If you currently possess the valuable item, please hand it over immediately to the <strong>Main Gate Security Office</strong> or <strong>Student Affairs Office</strong> for safekeeping in the lockable locker.
                                        </p>
                                        <Form.Check
                                            type="checkbox"
                                            id="securityConfirmed"
                                            name="securityConfirmed"
                                            checked={formData.securityConfirmed}
                                            onChange={handleChange}
                                            label={<strong>I understand this report will be reviewed confidentially by SIT staff and not posted to the public feed.</strong>}
                                        />
                                    </div>
                                )}

                                {/* Upload Progress */}
                                {loading && (
                                    <div className="upload-progress">
                                        <div className="progress-label">
                                            <span>Submitting report...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <ProgressBar 
                                            now={uploadProgress} 
                                            animated 
                                            striped 
                                            variant={reportType === 'PRIVATE' ? 'warning' : 'success'}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="form-navigation">
                            {currentStep > 1 && (
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    onClick={prevStep}
                                    className="btn-prev"
                                    disabled={loading}
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Previous
                                </Button>
                            )}
                            
                            {currentStep < 3 ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn-next"
                                >
                                    Next
                                    <i className="bi bi-arrow-right ms-2"></i>
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    className={`btn-submit-report ${reportType === 'PRIVATE' ? 'btn-warning text-dark fw-bold' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner size="sm" animation="border" className="me-2" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <i className={`bi ${reportType === 'PRIVATE' ? 'bi-shield-lock-fill' : 'bi-check-circle'} me-2`}></i>
                                            {reportType === 'PRIVATE' ? 'Submit Private Request' : 'Submit Report'}
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </Form>
                </div>
            </Container>
        </div>
    );
};

export default UploadItem;
