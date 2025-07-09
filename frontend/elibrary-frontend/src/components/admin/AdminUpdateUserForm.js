import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';

function AdminUpdateUserForm({ userToEditId, onClose, setMessage }) {
  const [userData, setUserData] = useState(null); // Stores the full user data fetched for editing
  const [form, setForm] = useState({
    name: '', phoneNumber: '', city: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '', confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({}); // Errors for user details form
  const [passwordErrors, setPasswordErrors] = useState({}); // Errors for password change form
  const [loading, setLoading] = useState(true); // Loading state for fetching user data

  // Helper function to extract a readable error message
  const getErrorMessage = (err) => {
    let errorMessage = 'An unexpected error occurred.';
    if (err.response) {
      if (err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.response.data && typeof err.response.data === 'object' && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else if (err.response.statusText) {
        errorMessage = `Error: ${err.response.status} ${err.response.statusText}`;
      } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
      } else {
          errorMessage = `An unknown error occurred (Status: ${err.response.status || 'N/A'}).`;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    return errorMessage;
  };

  // Effect to fetch user data when component mounts or userToEditId changes
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setMessage(''); // Clear global message
      try {
        // Calls the protected admin endpoint in Auth Service to get user's profile by ID
        const response = await authApi.get(`/users/profile-by-id/${userToEditId}`);
        setUserData(response.data); // Store full user data
        setForm({ // Populate form fields for editing
          name: response.data.name || '',
          phoneNumber: response.data.phoneNumber || '',
          city: response.data.city || ''
        });
      } catch (err) {
        console.error("Error fetching user data for admin edit:", err);
        setMessage(getErrorMessage(err), true);
        onClose(); // Close form if data can't be loaded
      } finally {
        setLoading(false);
      }
    };

    if (userToEditId) { // Only fetch if userToEditId is provided
      fetchUserData();
    }
  }, [userToEditId, setMessage, onClose]); // Dependencies: re-run if userToEditId changes or callbacks change

  // Handles changes in user details form
  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) { // Clear specific field error
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  // Handles changes in password change form
  const handlePasswordFormChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
    if (passwordErrors[e.target.name]) { // Clear specific password field error
      setPasswordErrors({ ...passwordErrors, [e.target.name]: '' });
    }
  };

  // Validation for user details form
  const validateDetailsForm = () => {
    let newErrors = {};
    let isValid = true;
    if (!form.name) { newErrors.name = 'Name is required.'; isValid = false; }
    if (form.phoneNumber && (form.phoneNumber.length !== 10 || isNaN(form.phoneNumber))) {
      newErrors.phoneNumber = 'Phone number must be 10 digits.'; isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  // Validation for password change form
  const validatePasswordForm = () => {
    let newErrors = {};
    let isValid = true;
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required.'; isValid = false;
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters.'; isValid = false;
    }
    if (!passwordForm.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Confirm new password is required.'; isValid = false;
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match.'; isValid = false;
    }
    setPasswordErrors(newErrors);
    return isValid;
  };

  // Handles submission for updating user details
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validateDetailsForm()) {
      setMessage('Please correct details form errors.', true);
      return;
    }
    try {
      // Calls the protected PUT endpoint in Auth Service for admin to update user details
      const response = await authApi.put(`/users/admin/${userToEditId}`, form);
      setMessage(`User ${response.data.email} details updated successfully!`);
    } catch (err) {
      console.error("Error updating user details:", err);
      setMessage(getErrorMessage(err), true);
    }
  };

  // Handles submission for changing user password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validatePasswordForm()) {
      setMessage('Please correct password form errors.', true);
      return;
    }
    try {
      // Calls the protected POST endpoint in Auth Service for admin to change user password
      const response = await authApi.post(`/users/admin/${userToEditId}/change-password`, { newPassword: passwordForm.newPassword });
      setMessage(response.data); // Success message from backend
      setPasswordForm({ newPassword: '', confirmNewPassword: '' }); // Clear password fields on success
      setPasswordErrors({}); // Clear password errors on success
    } catch (err) {
      console.error("Error changing user password:", err);
      setMessage(getErrorMessage(err), true);
    }
  };

  if (loading) return <p>Loading user details for editing...</p>;
  if (!userData) return <p>Error: Could not load user details.</p>;

  return (
    <div>
      <h2>Edit User: {userData.email}</h2>
      <button onClick={onClose} style={{ float: 'right', backgroundColor: '#6c757d' }}>Back to User List</button>

      {/* User Details Update Form */}
      <h4 style={{ marginTop: '20px' }}>Update Personal Details</h4>
      <form onSubmit={handleUpdateDetails}>
        <div>
          <label>Email (Read-only):</label>
          <input type="email" value={userData.email || ''} readOnly />
        </div>
        <div>
          <label>Name:</label>
          <input type="text" name="name" value={form.name} onChange={handleFormChange} required />
          {errors.name && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.name}</span>}
        </div>
        <div>
          <label>Phone Number:</label>
          <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleFormChange} />
          {errors.phoneNumber && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.phoneNumber}</span>}
        </div>
        <div>
          <label>City:</label>
          <input type="text" name="city" value={form.city} onChange={handleFormChange} />
        </div>
        <button type="submit">Update Details</button>
      </form>

      {/* Change Password Form */}
      <h4 style={{ marginTop: '20px' }}>Change User Password</h4>
      <form onSubmit={handleChangePassword}>
        <div>
          <label>New Password:</label>
          <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordFormChange} required />
          {passwordErrors.newPassword && <span style={{ color: 'red', fontSize: '0.9em' }}>{passwordErrors.newPassword}</span>}
        </div>
        <div>
          <label>Confirm New Password:</label>
          <input type="password" name="confirmNewPassword" value={passwordForm.confirmNewPassword} onChange={handlePasswordFormChange} required />
          {passwordErrors.confirmNewPassword && <span style={{ color: 'red', fontSize: '0.9em' }}>{passwordErrors.confirmNewPassword}</span>}
        </div>
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
}

export default AdminUpdateUserForm;