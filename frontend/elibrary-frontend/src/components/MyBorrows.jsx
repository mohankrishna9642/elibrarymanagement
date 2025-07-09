// src/components/MyBorrows.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getUserBorrows, returnBook } from '../services/borrowService';
import { useAuth } from '../context/AuthContext'; // Correct import path for your AuthContext

function MyBorrows() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true); // Local loading for borrow data
  const [error, setError] = useState('');
  const { currentUser, isLoggedIn, loading: authLoading } = useAuth(); // Get currentUser, isLoggedIn, and authLoading

  const fetchUserBorrows = useCallback(async () => {
    // 1. Wait for AuthContext to finish its initial loading.
    // 2. Ensure user is logged in and 'currentUser' object is available.
    if (authLoading) {
      setLoading(true); // Keep local loading true while auth is still loading
      return;
    }
    
    if (!isLoggedIn || !currentUser || !currentUser.id) {
      // If auth is done loading but user isn't logged in or ID is missing,
      // show an error and stop loading.
      setError('User not logged in or ID not available. Please log in.');
      setBorrows([]); // Clear any old borrow data
      setLoading(false); // Stop local loading
      return;
    }

    setLoading(true); // Start local loading for fetching borrows
    setError(''); // Clear previous error

    try {
      // Calls getUserBorrows() WITHOUT any arguments, as backend derives user ID from JWT
      const userBorrows = await getUserBorrows(); 
      setBorrows(userBorrows);
    } catch (err) {
      setError(`Failed to load borrowed books: ${err.response?.data?.message || err.message}`);
      setBorrows([]);
    } finally {
      setLoading(false); // End local loading
    }
  }, [currentUser, isLoggedIn, authLoading]); // Depend on relevant auth context values

  useEffect(() => {
    // Only fetch if authentication state is settled and user is potentially logged in
    // and fetchUserBorrows has a stable reference (due to useCallback)
    fetchUserBorrows();
  }, [fetchUserBorrows]);

  const handleReturn = async (borrowId) => {
    if (!window.confirm('Are you sure you want to return this book?')) {
      return;
    }
    try {
      await returnBook(borrowId);
      alert('Book returned successfully!');
      fetchUserBorrows(); // Refresh the list of borrowed books after a return
    } catch (err) {
      alert(`Error returning book: ${err.response?.data?.message || err.message}`);
    }
  };

  // Conditional rendering based on authentication and data loading states
  if (authLoading) return <div>Authenticating user...</div>;
  if (loading) return <div>Loading your borrowed books...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  // If not logged in, show a specific message (after auth loading is done)
  if (!isLoggedIn) return <div style={{ color: 'orange' }}>Please log in to view your borrowed books.</div>;
  
  return (
    <div>
      <h2>My Borrowed Books</h2>
      
      {borrows.length === 0 ? (
        <p>You haven't borrowed any books yet.</p>
      ) : (
        <div className="borrows-grid"> {/* Apply grid container class */}
          {borrows.map((borrow) => (
            <div key={borrow.id} className="borrow-card"> {/* Apply card class */}
              <h4>{borrow.bookTitle || 'Unknown Title'}</h4>
              <p><strong>Book ID:</strong> {borrow.bookId}</p>
              <p><strong>Borrowed Date:</strong> {new Date(borrow.borrowDate).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {new Date(borrow.dueDate).toLocaleDateString()}</p>
              <p>
                <strong>Status:</strong>
                {/* Dynamically add status class */}
                <span className={`status ${borrow.status}`}>
                  {borrow.status}
                </span>
              </p>
              {borrow.status === 'BORROWED' && (
                <button onClick={() => handleReturn(borrow.id)}>
                  Return
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBorrows;