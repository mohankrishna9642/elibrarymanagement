import React, { useState } from 'react';
import { publicApi } from '../../services/api';

function Register({ onSwitchToLogin, setMessage }) {
  const [form, setForm] = useState({
    email: '', name: '', phoneNumber: '', city: '', password: '', confirmPassword: ''
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

    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!form.email.includes('@')) {
      newErrors.email = 'Email must contain an @ symbol.';
      isValid = false;
    }

    // Name validation
    if (!form.name) {
      newErrors.name = 'Name is required.';
      isValid = false;
    }

    // Password validation (min 8 characters)
    if (!form.password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    } else if (form.password.length < 8) { // Min 8 characters
      newErrors.password = 'Password must be at least 8 characters.';
      isValid = false;
    }

    // Confirm Password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required.';
      isValid = false;
    } else if (form.password !== form.confirmPassword) { // Passwords must match
      newErrors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    // Phone Number validation (optional field, so only validate if provided)
    if (form.phoneNumber) {
      if (form.phoneNumber.length !== 10 || isNaN(form.phoneNumber)) { // Must be 10 digits and a number
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

    if (!validateForm()) { // --- CRITICAL STEP: Run client-side validation ---
      setMessage('Please correct the form errors.', true); // Display a global error message for client-side failures
      return; // STOP submission if client-side validation fails
    }

    // If client-side validation passes, proceed with API call
    try {
      const response = await publicApi.post('/auth/register', form); // Call backend register endpoint
      setMessage(response.data); // Display success message from backend (e.g., "User registered successfully!...")
      
      // Clear form and errors on successful registration
      setForm({email: '', name: '', phoneNumber: '', city: '', password: '', confirmPassword: ''});
      setErrors({}); 
      
      onSwitchToLogin(); // Navigate back to login page on SUCCESS
    } catch (error) {
      // Handle API call errors (e.g., 400 from backend validation, 409 for duplicate email)
      const errorMessage = error.response ? error.response.data.message || error.response.data : 'Registration failed: Network error.';
      setMessage(errorMessage, true); // Display backend error message globally
      // No onSwitchToLogin() here, stay on register page to let user fix errors
    }
  };

  return (
    <div>
      <h2>Register New User</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
          {errors.email && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.email}</span>}
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
        <div>
          <label>Password:</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required />
          {errors.password && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.password}</span>}
        </div>
        <div>
          <label>Confirm Password:</label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
          {errors.confirmPassword && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.confirmPassword}</span>}
        </div>
        <button type="submit">Register</button>
      </form>
      <p><a href="#" onClick={onSwitchToLogin}>Back to Login</a></p>
    </div>
  );
}

export default Register;