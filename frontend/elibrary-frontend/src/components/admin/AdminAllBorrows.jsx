// src/components/admin/AdminAllBorrows.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Path to your AuthContext
import { getAllBorrows } from '../../services/borrowService'; // Import the service function

function AdminAllBorrows({ onBackToDashboard, setMessage }) {
  const { isAdmin, loading: authLoading } = useAuth(); // Check if the user is an admin
  const [allBorrows, setAllBorrows] = useState([]);
  const [loading, setLoading] = useState(true); // Local loading for fetching borrows
  const [error, setError] = useState('');

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

  const fetchAllBorrows = useCallback(async () => {
    if (authLoading) { // Wait for authentication state to be determined
        setLoading(true);
        return;
    }
    if (!isAdmin) { // Only fetch if user is confirmed admin
      setError('Access Denied: You must be an administrator to view all borrowings.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(''); // Clear previous error
    try {
      const response = await getAllBorrows(); // Call the service to get all borrows
      setAllBorrows(response); // Assuming response is directly the list of borrows
    } catch (err) {
      console.error("Error fetching all borrows for admin:", err);
      setError(getErrorMessage(err));
      setAllBorrows([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, authLoading]); // Dependencies: isAdmin and authLoading from AuthContext

  useEffect(() => {
    fetchAllBorrows();
  }, [fetchAllBorrows]); // Re-fetch when fetchAllBorrows callback changes (due to its dependencies)


  if (authLoading) return <p>Checking admin privileges...</p>;
  if (!isAdmin) {
    return <p style={{ color: 'red' }}>Access Denied: Only administrators can view all borrowings.</p>;
  }
  if (loading) return <p>Loading all borrowing records...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Admin: All Borrowing Overview</h2>

      {allBorrows.length === 0 && !loading ? (
        <p>No borrowing records found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Borrow ID</th>
              <th>User ID</th>
              <th>User Email</th> {/* Assuming you can map user ID to email if needed, or get from backend */}
              <th>Book ID</th>
              <th>Book Title</th> {/* Assuming book title can be mapped from book ID if needed */}
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {allBorrows.map(borrow => (
              <tr key={borrow.id}>
                <td>{borrow.id}</td>
                <td>{borrow.userId}</td>
                <td>{borrow.userEmail || 'N/A'}</td> {/* Display user email if available from backend */}
                <td>{borrow.bookId}</td>
                <td>{borrow.bookTitle || 'N/A'}</td> {/* Display book title if available from backend */}
                <td>{new Date(borrow.borrowDate).toLocaleDateString()}</td>
                <td>{new Date(borrow.dueDate).toLocaleDateString()}</td>
                <td>{borrow.returnDate ? new Date(borrow.returnDate).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className={`status ${borrow.status}`}>
                    {borrow.status}
                  </span>
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

export default AdminAllBorrows;