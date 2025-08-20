import React, { useState } from 'react';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormInput,
  CFormTextarea,
  CFormSelect,
  CButton,
  CSpinner,
  CAlert,
} from '@coreui/react';
import PropTypes from 'prop-types';
import axiosInstance from '../../config/axiosConfig';
import './Ticket.scss';

const TicketForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
    category: 'Technical',
    businessId: '', // This should be fetched from your auth context
    createdBy: ''  // This should be fetched from your auth context
  });

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  const categoryOptions = [
    { value: 'Technical', label: 'Technical Issue' },
    { value: 'Billing', label: 'Billing Issue' },
    { value: 'Account', label: 'Account Related' },
    { value: 'Feature', label: 'Feature Request' },
    { value: 'Other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Replace these with actual values from your auth context
      const businessId = "YOUR_BUSINESS_ID";
      const userId = "YOUR_USER_ID";

      const payload = {
        ...formData,
        businessId,
        createdBy: userId
      };

      const { data } = await axiosInstance.post('http://localhost:5040/api/tickets', payload, {
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add actual JWT token from your auth context
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
      });

      setSuccess(true);
      setFormData({
        subject: '',
        description: '',
        priority: 'Medium',
        category: 'Technical',
        businessId: '',
        createdBy: ''
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCard className="ticket-form">
      <CCardHeader>
        <h3>Create Support Ticket</h3>
      </CCardHeader>
      <CCardBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>
            {error}
          </CAlert>
        )}
        {success && (
          <CAlert color="success" dismissible onClose={() => setSuccess(false)}>
            Ticket created successfully!
          </CAlert>
        )}
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormInput
              type="text"
              id="subject"
              name="subject"
              label="Subject"
              placeholder="Brief description of the issue"
              value={formData.subject}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mb-3">
            <CFormSelect
              id="category"
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleInputChange}
              options={categoryOptions.map(option => ({
                label: option.label,
                value: option.value
              }))}
              required
            />
          </div>
          <div className="mb-3">
            <CFormSelect
              id="priority"
              name="priority"
              label="Priority"
              value={formData.priority}
              onChange={handleInputChange}
              options={priorityOptions.map(option => ({
                label: option.label,
                value: option.value
              }))}
              required
            />
          </div>
          <div className="mb-3">
            <CFormTextarea
              id="description"
              name="description"
              label="Description"
              placeholder="Detailed description of your issue..."
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              required
            />
          </div>
          <div className="mb-3">
            <CFormInput
              type="file"
              id="attachments"
              name="attachments"
              label="Attachments (Optional)"
              onChange={handleFileChange}
              multiple
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            />
            <small className="text-muted">
              Supported files: Images (JPG, PNG), Documents (PDF, DOC, DOCX)
            </small>
          </div>
          <div className="d-grid gap-2 d-md-flex justify-content-md-end">
            <CButton type="submit" color="primary" disabled={loading}>
              {loading ? (
                <>
                  <CSpinner size="sm" className="me-2" />
                  Creating Ticket...
                </>
              ) : (
                'Create Ticket'
              )}
            </CButton>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
};

TicketForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default TicketForm;
