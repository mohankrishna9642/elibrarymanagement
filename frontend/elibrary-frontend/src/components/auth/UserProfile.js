import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import ChangePassword from './ChangePassword';

function UserProfile({ setActiveTab, setMessage }) {
  const { currentUser, refreshUserData } = useAuth();
  const [form, setForm] = useState({
    name: '', phoneNumber: '', city: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        phoneNumber: currentUser.phoneNumber || '',
        city: currentUser.city || ''
      });
      setLoading(false);
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!form.name) {
        newErrors.name = 'Name is required.';
        isValid = false;
    }

    if (form.phoneNumber) {
      if (form.phoneNumber.length !== 10 || isNaN(form.phoneNumber)) {
        newErrors.phoneNumber = 'Phone number must be 10 digits.';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validateForm()) {
      setMessage('Please correct the form errors.', true);
      return;
    }

    try {
      await authApi.put('/users/profile', form);
      await refreshUserData(); // Refresh global currentUser state from backend
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage(getErrorMessage(error), true);
    }
  };

  if (loading) return <p>Loading user profile...</p>;
  if (!currentUser) return <p>Error: User data not available.</p>;

  return (
    <div>
      <h3>My Profile Details & Management</h3>

      {!showChangePassword ? (
        <>
          <h4>Personal Information:</h4>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Email (Read-only):</label>
              <input type="email" value={currentUser.email || ''} readOnly />
            </div>
            <div>
              <label>Name:</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
              {errors.name && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.name}</span>}
            </div>
            <div>
              <label>Phone Number:</label>
              <input type="text" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} />
              {errors.phoneNumber && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.phoneNumber}</span>}
            </div>
            <div>
              <label>City:</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} />
            </div>
            <button type="submit" style={{ marginRight: '10px' }}>Update Profile</button>
            <button type="button" onClick={() => setShowChangePassword(true)}>Change Password</button>
          </form>

          <h4 style={{ marginTop: '20px' }}>Account Status:</h4>
          <p>Registration Date: {currentUser.registrationDate ? new Date(currentUser.registrationDate).toLocaleDateString() : 'N/A'}</p>
          <p>Access Status: {currentUser.accountNonLocked ? 'Active' : 'Restricted'}</p>
          <p>Role(s): {currentUser.roles ? currentUser.roles.join(', ') : 'N/A'}</p>

          <p style={{ marginTop: '20px' }}><a href="#" onClick={() => setActiveTab('userDashboardMain')}>Back to Dashboard</a></p>
        </>
      ) : (
        <ChangePassword
          onBackToDashboard={() => setShowChangePassword(false)}
          setMessage={setMessage}
        />
      )}
    </div>
  );
}

export default UserProfile;