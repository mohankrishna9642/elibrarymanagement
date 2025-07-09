import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assuming this provides the login function

function Login({ onSwitchToRegister, onLoginSuccess, setMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false); // Initialize loading state
  const [error, setError] = useState(null); // Initialize error state for local display
  
  // State for password visibility
  const [showPassword, setShowPassword] = useState(false); 

  const { login } = useAuth(); // Destructure login function from useAuth hook

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear email-specific error when user types
    if (errors.email) {
      setErrors({ ...errors, email: '' });
    }
  };

  // Handler to toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required.';
      isValid = false;
    } else if (!email.includes('@')) {
      newErrors.email = 'Email must contain an @ symbol.';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required.';
      isValid = false;
    }

    setErrors(newErrors); // Update validation errors state
    return isValid; // Return overall form validity
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setMessage(''); // Clear any previous general messages (from parent component)
    setError(null); // Clear local error message

    if (!validateForm()) {
      setError('Please enter valid login credentials.'); // Set local error message
      return; // Stop the submission
    }

    setLoading(true); // Start loading
    try {
      // Attempt login using the login function from AuthContext
      const result = await login(email, password); 
      if (result.success) {
        setMessage('Login successful!'); // Set success message (for parent)
        onLoginSuccess(); // Call success callback from parent component
      } else {
        // Set error message from login result, or a generic one
        const errorMessage = result.message || 'Login failed: Network error.';
        setError(errorMessage); // Set local error message
      }
    } catch (err) {
      console.error('Login failed:', err);
      // Fallback for unexpected errors (e.g., network issues before server response)
      setError(err.message || 'An unexpected error occurred during login.'); 
    } finally {
      setLoading(false); // Stop loading regardless of success/failure
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Login</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div style={styles.formGroup}>
          <label htmlFor="email" style={styles.label}>Email:</label>
          <input 
            type="email" 
            id="email" 
            value={email} 
            onChange={handleEmailChange} 
            required 
            style={{ ...styles.input, borderColor: errors.email ? 'red' : '#ccc' }}
          />
          {errors.email && <span style={styles.errorText}>{errors.email}</span>}
        </div>
        
        {/* Password field with toggle */}
        <div style={{ ...styles.formGroup, position: 'relative' }}>
          <label htmlFor="password" style={styles.label}>Password:</label>
          <input 
            type={showPassword ? 'text' : 'password'} // Dynamically change type
            id="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ ...styles.input, borderColor: errors.password ? 'red' : '#ccc', paddingRight: '40px' }} // Make space for icon
          />
          {/* Eye icon/button */}
          <button 
            type="button" // Important: type="button" to prevent accidental form submission
            onClick={handleTogglePasswordVisibility}
            style={styles.toggleButton}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '🙈'} {/* Corrected symbols */}
          </button>
          {errors.password && <span style={styles.errorText}>{errors.password}</span>}
        </div>
        
        <button 
          type="submit"
          style={styles.submitButton}
          disabled={loading} // Disable button when loading
        >
          {loading ? 'Logging in...' : 'Login'} {/* Show loading text */}
        </button>

        {error && <div style={styles.alertError}>{error}</div>} {/* Local error display */}

        <p style={styles.signupText}>
          Don't have an account? <a href="#" onClick={(e) => {
            e.preventDefault(); 
            onSwitchToRegister();
          }} style={styles.link}>Sign Up</a>
        </p>
      </form>
    </div>
  );
}

// Basic inline styles for a clean look without Material-UI
const styles = {
  container: {
    maxWidth: '400px',
    margin: '80px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
  },
  heading: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box', // Include padding in width
  },
  toggleButton: {
    position: 'absolute',
    right: '10px',
    top: '50%', // Aligns with the middle of the input field
    transform: 'translateY(-50%)', // Adjusts for button's own height
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2em',
    padding: '0',
    zIndex: '1',
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#007bff', // Blue color for primary action
    color: 'white',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1em',
    transition: 'background-color 0.3s ease',
  },
  submitButtonHover: { // Example hover style if you want to add it
    backgroundColor: '#0056b3',
  },
  alertError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '15px',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: '0.9em',
    display: 'block', // Ensures it takes its own line
    marginTop: '5px',
  },
  signupText: {
    textAlign: 'center',
    marginTop: '15px',
    color: '#555',
  },
  link: {
    color: '#007bff',
    textDecoration: 'none',
  },
  linkHover: { // Example hover style for link
    textDecoration: 'underline',
  },
};

export default Login;