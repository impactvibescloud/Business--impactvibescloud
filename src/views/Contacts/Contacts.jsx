import React, { useState, useEffect } from "react";
import {
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CSpinner,
} from "@coreui/react";

import { apiCall } from '../../config/api'

export default function Contacts() {
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewContact, setViewContact] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('name');
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    tags: [],
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          throw new Error('Authentication required. Please login again.');
        }

        // First try to get businessId from user details API
        const userResponse = await fetch('/api/v1/user/details', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const userData = await userResponse.json();
        
        // Get businessId from API response or fall back to localStorage
        const businessId = userData?.user?.businessId || localStorage.getItem('businessId');

        if (!businessId) {
          throw new Error('Business ID not found. Please login again.');
        }

        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy: 'createdAt',
          order: 'desc'
        });

        if (searchTerm) {
          queryParams.append('search', searchTerm);
          queryParams.append('searchField', searchField);
        }

  const data = await apiCall(`/contacts/business/${businessId}?${queryParams}`, 'GET');
        if (data.success && data.data) {
          setContacts(data.data);
          // Safely handle pagination data with fallbacks
          const total = data.pagination?.total ?? data.data.length;
          const pages = data.pagination?.pages ?? 1;
          setTotalPages(pages);
          setTotalContacts(total);
        } else {
          setContacts([]);
          setTotalPages(1);
          setTotalContacts(0);
        }
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [currentPage, itemsPerPage]);

  const resetForm = () => {
    setContactForm({
      name: "",
      email: "",
      phone: "",
      company: "",
      tags: [],
    });
    setIsEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "tags") {
      setContactForm((prev) => ({
        ...prev,
        tags: value.trim()
          ? value.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      }));
    } else {
      setContactForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditMode ? "PUT" : "POST";
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    try {
  const userData = await apiCall('/v1/user/details', 'GET');
      const businessId = userData?.user?.businessId || localStorage.getItem('businessId');

      if (!businessId) {
        alert('Business ID not found. Please login again.');
        return;
      }

      const endpoint = isEditMode
        ? `/api/contacts/business/${businessId}/${contactForm._id}`
        : `/api/contacts/business/${businessId}`;

      const savedContact = await apiCall(endpoint, method, { ...contactForm, businessId });

      if (isEditMode) {
        setContacts((prev) =>
          prev.map((c) =>
            c.email === savedContact.email ? savedContact : c
          )
        );
      } else {
        setContacts((prev) => [...prev, savedContact]);
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      alert(err.message);
    }

    const endpoint = isEditMode
      ? `/api/contacts/business/${businessId}/${contactForm._id}`
      : `/api/contacts/business/${businessId}`;

    apiCall(endpoint, method, { ...contactForm, businessId })
      .then((res) => {
        // apiCall returns parsed response data
        return res;
      })
      .then((savedContact) => {
        if (isEditMode) {
          setContacts((prev) =>
            prev.map((c) =>
              c.email === savedContact.email ? savedContact : c
            )
          );
        } else {
          setContacts((prev) => [...prev, savedContact]);
        }
        setShowModal(false);
        resetForm();
      })
      .catch((err) => alert(err.message));
  };

  const handleEdit = (contact) => {
    setContactForm(contact);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (contactId) => {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
      alert('Authentication required. Please login again.');
      return;
    }
    
    try {
      const userResponse = await fetch('/api/v1/user/details', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const userData = await userResponse.json();
      const businessId = userData?.user?.businessId || localStorage.getItem('businessId');

      if (!businessId) {
        alert('Business ID not found. Please login again.');
        return;
      }

      const response = await fetch(`${API_BASE}/business/${businessId}/${contactId}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error("Delete failed");
      setContacts((prev) => prev.filter((c) => c._id !== contactId));
      setDeleteConfirm(null);
    } catch (err) {
      alert(err.message);
    }

    fetch(`${API_BASE}/business/${businessId}/${contactId}`, { 
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${authToken}`
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Delete failed");
        setContacts((prev) => prev.filter((c) => c._id !== contactId));
        setDeleteConfirm(null);
      })
      .catch((err) => alert(err.message));
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <CSpinner /> Loading contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-danger">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Contacts</h2>
        <CButton color="primary" onClick={() => setShowModal(true)}>
          Add Contact
        </CButton>
      </div>

      {/* Search and Filter Section */}
      <div className="d-flex gap-3 mb-3">
        <div style={{ width: '200px' }}>
          <select 
            className="form-select"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="company">Company</option>
            <option value="tags">Tags</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            className="form-control"
            placeholder={`Search by ${searchField}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <CTable className="mt-3" hover>
        <CTableHead>
          <CTableRow>       
            <CTableHeaderCell>Name</CTableHeaderCell>
            <CTableHeaderCell>Email</CTableHeaderCell>
            <CTableHeaderCell>Phone</CTableHeaderCell>
            <CTableHeaderCell>Company</CTableHeaderCell>
            <CTableHeaderCell>Tags</CTableHeaderCell>
            <CTableHeaderCell>Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {(contacts || []).map((c) => (
            <CTableRow key={c.email}>
              <CTableDataCell>{c.name}</CTableDataCell>
              <CTableDataCell>{c.email}</CTableDataCell>
              <CTableDataCell>{c.phone}</CTableDataCell>
              <CTableDataCell>{c.company}</CTableDataCell>
              <CTableDataCell>{(c.tags || []).join(", ")}</CTableDataCell>
              <CTableDataCell>
                <CButton
                  size="sm"
                  color="info"
                  className="me-2"
                  onClick={() => setViewContact(c)}
                >
                  View
                </CButton>
                <CButton
                  size="sm"
                  color="warning"
                  className="me-2"
                  onClick={() => handleEdit(c)}
                >
                  Edit
                </CButton>
                <CButton
                  size="sm"
                  color="danger"
                  onClick={() => setDeleteConfirm(c)}
                >
                  Delete
                </CButton>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          Showing {contacts.length} of {totalContacts} contacts
        </div>
        <div>
          <CButton 
            color="light"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
            className="me-2"
          >
            Previous
          </CButton>
          <span className="mx-2">
            Page {currentPage} of {totalPages}
          </span>
          <CButton
            color="light"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="ms-2"
          >
            Next
          </CButton>
        </div>
      </div>

      {/* View Contact Modal */}
      <CModal visible={!!viewContact} onClose={() => setViewContact(null)}>
        <CModalHeader closeButton>
          <CModalTitle>Contact Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {viewContact && (
            <div>
              <p><strong>Name:</strong> {viewContact.name}</p>
              <p><strong>Email:</strong> {viewContact.email}</p>
              <p><strong>Phone:</strong> {viewContact.phone}</p>
              <p><strong>Company:</strong> {viewContact.company}</p>
              <p><strong>Tags:</strong> {(viewContact.tags || []).join(", ")}</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setViewContact(null)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Add/Edit Contact Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader closeButton>
          <CModalTitle>{isEditMode ? "Edit Contact" : "Add Contact"}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm onSubmit={handleSubmit}>
            <div className="mb-3">
              <CFormLabel>Name</CFormLabel>
              <CFormInput
                type="text"
                name="name"
                value={contactForm.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Email</CFormLabel>
              <CFormInput
                type="email"
                name="email"
                value={contactForm.email}
                onChange={handleInputChange}
                required
                disabled={isEditMode}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Phone</CFormLabel>
              <CFormInput
                type="text"
                name="phone"
                value={contactForm.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Company</CFormLabel>
              <CFormInput
                type="text"
                name="company"
                value={contactForm.company}
                onChange={handleInputChange}
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Tags</CFormLabel>
              <CFormInput
                type="text"
                name="tags"
                placeholder="Enter comma-separated tags"
                value={Array.isArray(contactForm.tags) ? contactForm.tags.join(", ") : ""}
                onChange={handleInputChange}
              />
            </div>
            <CButton type="submit" color="primary">
              {isEditMode ? "Update Contact" : "Add Contact"}
            </CButton>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Delete Confirmation Modal */}
      <CModal visible={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <CModalHeader closeButton>
          <CModalTitle>Confirm Delete</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete {deleteConfirm?.name}?
        </CModalBody>
        <CModalFooter>
          <CButton color="danger" onClick={() => handleDelete(deleteConfirm.email)}>
            Delete
          </CButton>
          <CButton color="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  );
}
