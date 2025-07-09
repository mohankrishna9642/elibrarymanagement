// src/components/BorrowBookButton.jsx
import React, { useState } from 'react';
import { borrowBook } from '../services/borrowService';
import { useAuth } from '../context/AuthContext'; // Correct import path

function BorrowBookButton({ bookId, onBorrowSuccess, onBorrowError }) { // <--- MODIFIED: Added onBorrowError
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // Keep local message for simple cases, or rely fully on parent's setMessage
  const { currentUser, isLoggedIn } = useAuth();

  const handleBorrow = async () => {
    if (!isLoggedIn || !currentUser || !currentUser.id) {
      const msg = 'Please log in to borrow a book.';
      setMessage(msg); // Local message
      if (onBorrowError) onBorrowError({ response: { data: { message: msg }, status: 401 } }); // Pass to parent
      return;
    }

    setLoading(true);
    setMessage(''); // Clear local message
    try {
      const newBorrow = await borrowBook(bookId, currentUser.id);
      setMessage(`Book "${newBorrow.bookTitle || bookId}" borrowed successfully!`);
      if (onBorrowSuccess) {
        onBorrowSuccess(newBorrow);
      }
    } catch (error) {
      // Pass the error object directly to the parent's handler
      if (onBorrowError) {
        onBorrowError(error); // <--- MODIFIED: Call onBorrowError with the actual error
      } else {
        // Fallback if no parent handler is provided (shouldn't happen with BrowseBooks)
        setMessage(`Failed to borrow book: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleBorrow} disabled={loading || !isLoggedIn}>
        {loading ? 'Borrowing...' : (isLoggedIn ? 'Borrow This Book' : 'Login to Borrow')}
      </button>
      {/* Optionally, you can remove this local message display if you always rely on parent's setMessage */}
      {/* For now, keeping it for immediate feedback on the button itself if needed */}
      {message && <p style={{ color: message.includes('Failed') || message.includes('login') ? 'red' : 'green', fontSize: '0.85em' }}>{message}</p>}
    </div>
  );
}

export default BorrowBookButton;