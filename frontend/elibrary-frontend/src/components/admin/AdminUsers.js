import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import AdminUpdateUserForm from './AdminUpdateUserForm'; // Correct Import: AdminUpdateUserForm is in the same folder
import { useAuth } from '../../context/AuthContext';

function AdminUsers({ onBackToDashboard, setMessage }) {
  const { isAdmin } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false); // Controls visibility of the AdminUpdateUserForm
  const [userToEditId, setUserToEditId] = useState(null); // Stores the ID of the user being edited

  // Helper function to extract a readable error message from Axios error object
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

  // Function to fetch all users for the admin view
  const fetchUsers = async () => {
    setLoading(true);
    setError(''); // Clear previous error
    try {
      const response = await authApi.get('/users/admin/all'); // Call the protected admin endpoint
      setUsersList(response.data.content); // Assuming backend returns a Page object with 'content' array
    } catch (err) {
      console.error("Error fetching admin users:", err); // Log the full error for debugging
      setError(getErrorMessage(err)); // Use helper to ensure a string error message
      setUsersList([]); // Clear users on error
    } finally {
      setLoading(false); // Set loading to false once fetch attempt is complete
    }
  };

  // Effect hook to fetch users when the component mounts or when the AdminUpdateUserForm is closed
  useEffect(() => {
    if (!showUpdateForm) { // Only fetch users if the update form is not currently open
      fetchUsers();
    }
  }, [showUpdateForm]); // Dependency on showUpdateForm to re-fetch when form is closed

  // Handles restricting or activating a user's account
  const handleRestrictActivateUser = async (userId, action) => {
    setMessage(''); // Clear global message
    if (window.confirm(`Are you sure you want to ${action} user ID ${userId}?`)) {
        try {
            const endpoint = `/users/admin/${userId}/${action}`;
            // Call the protected PUT endpoint in Auth Service
            const response = await authApi.put(endpoint, {});
            setMessage(response.data); // Display success message from backend (should be a string)
            fetchUsers(); // Refresh the list after status change
        } catch (err) {
            console.error(`Error ${action}ing user:`, err); // Log the full error
            setMessage(getErrorMessage(err), true); // Use helper for global error message
        }
    }
  };

  // Handles opening the AdminUpdateUserForm for editing a specific user
  const handleEditUser = (userId) => {
    setUserToEditId(userId); // Store the ID of the user to be edited
    setShowUpdateForm(true); // Show the AdminUpdateUserForm
  };

  // Handles deleting a user
  const handleDeleteUser = async (userId) => {
    setMessage(''); // Clear global message
    if (window.confirm(`Are you sure you want to delete user ID ${userId}? This action cannot be undone.`)) {
      try {
        // Call the protected DELETE endpoint in Auth Service
        const response = await authApi.delete(`/users/admin/${userId}`);
        setMessage(response.data); // Display success message from backend
        fetchUsers(); // Refresh the list after deletion
      } catch (err) {
        console.error(`Error deleting user ${userId}:`, err); // Log the full error
        setMessage(getErrorMessage(err), true); // Use helper for global error message
      }
    }
  };

  // Callback function for when the AdminUpdateUserForm is closed (from child component)
  const handleFormClose = () => {
    setShowUpdateForm(false); // Hide the form
    setUserToEditId(null); // Clear any editing state
    fetchUsers(); // Refresh the user list after form close
  };

  // Conditional rendering for non-admin users (robustness check)
  if (!isAdmin) {
      return <p style={{ color: 'red' }}>Access Denied: Only administrators can manage users.</p>;
  }
  // Conditional rendering for loading state
  if (loading) return <p>Loading users...</p>;
  // Conditional rendering for error state
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  // Conditional rendering: If showUpdateForm is true, render the AdminUpdateUserForm
  if (showUpdateForm) {
    return (
      <AdminUpdateUserForm
        userToEditId={userToEditId} // Pass the ID of the user to be edited
        onClose={handleFormClose} // Callback to close the form
        setMessage={setMessage} // Callback to display messages
      />
    );
  }

  // Default rendering: Show the list of users and main action button for admin
  return (
    <div>
      <h3>Admin: User Management</h3>

      {/* This button is generally for AdminBooks.js; it's commented out/removed from AdminUsers.js */}
      {/* <button onClick={() => setShowAddForm(true)} style={{ marginBottom: '20px' }}>Add New Book</button> */}
      {usersList.length === 0 && !loading ? (
        <p>No users found (or filtered).</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Reg. Date</th>
              <th>Status</th>
              <th>Roles</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber || 'N/A'}</td>
                <td>{user.city || 'N/A'}</td>
                <td>{user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'N/A'}</td>
                <td>{user.accountNonLocked ? 'Active' : 'Restricted'}</td>
                <td>{user.roles ? user.roles.join(', ') : 'N/A'}</td>
                <td>
                  <button onClick={() => handleRestrictActivateUser(user.id, 'restrict')} style={{ marginRight: '10px', backgroundColor: '#ffc107', color: 'black' }}>Restrict</button>
                  <button onClick={() => handleRestrictActivateUser(user.id, 'activate')} style={{ marginRight: '10px', backgroundColor: '#28a745' }}>Activate</button>
                  <button onClick={() => handleEditUser(user.id)} style={{ marginRight: '10px', backgroundColor: '#007bff' }}>Edit</button>
                  <button onClick={() => handleDeleteUser(user.id)} style={{ backgroundColor: '#dc3545' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p style={{ marginTop: '20px' }}><a href="#" onClick={onBackToDashboard}>Back to Dashboard</a></p>
    </div>
  );
}

export default AdminUsers;