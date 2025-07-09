import React, { useState } from 'react';
import { authApi } from '../../services/api';

function ChangePassword({ onBackToDashboard, setMessage }) {
  const [form, setForm] = useState({
    currentPassword: '', newPassword: '', confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!form.currentPassword) {
      newErrors.currentPassword = 'Current password is required.';
      isValid = false;
    }

    // New Password validation (min 8 characters)
    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required.';
      isValid = false;
    } else if (form.newPassword.length < 8) { // Min 8 characters
      newErrors.newPassword = 'New password must be at least 8 characters.';
      isValid = false;
    }

    if (!form.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Confirm new password is required.';
      isValid = false;
    } else if (form.newPassword !== form.confirmNewPassword) { // Passwords must match
      newErrors.confirmNewPassword = 'New passwords do not match.';
      isValid = false;
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
      const response = await authApi.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmNewPassword,
      });
      setMessage(response.data);
      setForm({currentPassword: '', newPassword: '', confirmNewPassword: ''});
      setErrors({}); // Clear all errors on success
      onBackToDashboard(); // Go back to profile view
    } catch (error) {
      const errorMessage = error.response ? error.response.data.message || error.response.data : 'Change password failed: Network error.';
      setMessage(errorMessage, true);
    }
  };

  return (
    <div>
      <h2>Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Current Password:</label>
          <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} required />
          {errors.currentPassword && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.currentPassword}</span>}
        </div>
        <div>
          <label>New Password:</label>
          <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required />
          {errors.newPassword && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.newPassword}</span>}
        </div>
        <div>
          <label>Confirm New Password:</label>
          <input type="password" name="confirmNewPassword" value={form.confirmNewPassword} onChange={handleChange} required />
          {errors.confirmNewPassword && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.confirmNewPassword}</span>}
        </div>
        <button type="submit">Submit</button>
      </form>
      <p><a href="#" onClick={onBackToDashboard}>Back to My Profile</a></p>
    </div>
  );
}

export default ChangePassword;