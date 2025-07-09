// src/components/library/BrowseBooks.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { publicApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BorrowBookButton from '../BorrowBookButton';

function BrowseBooks({ setActiveTab, setMessage }) {
  const { isLoggedIn, currentUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');

  const getErrorMessage = (err) => {
    let errorMessage = 'Failed to fetch books. Please try again later.';
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

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (searchQuery) params.query = searchQuery;
      if (filterGenre) params.genre = filterGenre;
      if (filterAuthor) params.author = filterAuthor;

      const apiInstance = isLoggedIn ? authApi : publicApi;
      const response = await apiInstance.get('/books/browse', { params });
      setBooks(response.data);
    } catch (err) {
      console.error("Error fetching books:", err);
      setError(getErrorMessage(err));
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterGenre, filterAuthor, isLoggedIn]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleReadOnline = (filePath) => {
    if (filePath) {
      window.open(`http://localhost:8080${filePath}`, '_blank');
    } else {
      setMessage('Book file not available.', true);
    }
  };

  const handleBorrowSuccessInBrowse = (borrowRecord) => {
    setMessage(`Book "${borrowRecord.bookTitle || borrowRecord.bookId}" borrowed successfully! Enjoy your read!`, false); // More friendly success message
    fetchBooks(); // Refresh to reflect updated counts
  };

  const handleBorrowErrorInBrowse = (error) => { // <--- NEW ERROR HANDLER
    let userFriendlyMessage = 'Failed to borrow book. Please try again.';
    if (error.response) {
      const status = error.response.status;
      const backendMessage = error.response.data?.message || error.response.data;

      if (status === 400) { // Bad Request, often means business rule violation
        if (typeof backendMessage === 'string' && backendMessage.includes("already borrowed this book")) {
            userFriendlyMessage = "You already have this book borrowed. Please return it before borrowing again.";
        } else if (typeof backendMessage === 'string' && backendMessage.includes("no copies available")) {
            userFriendlyMessage = "Sorry, no copies of this book are currently available.";
        } else if (typeof backendMessage === 'string' && backendMessage.includes("already borrowed a copy of this book")) { // More specific to your rule
            userFriendlyMessage = "You've already borrowed a copy of this book. You can only borrow one at a time.";
        }
        // Fallback for other 400 errors from backend
        else if (typeof backendMessage === 'string') {
            userFriendlyMessage = `Borrow failed: ${backendMessage}`;
        }
      } else if (status === 404) { // Not Found, e.g., book ID doesn't exist
          userFriendlyMessage = "Book not found or is no longer available.";
      } else if (status === 401 || status === 403) { // Unauthorized/Forbidden
          userFriendlyMessage = "You need to be logged in and authorized to borrow books.";
          setActiveTab('login'); // Suggest going to login page
      }
    }
    setMessage(userFriendlyMessage, true); // Display as an error
  };


  if (loading) return <p>Loading books...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h2>Browse E-Books</h2>

      <form onSubmit={handleSearch} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search by title, author, or genre"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flexGrow: 1, padding: '8px' }}
        />
        <button type="submit">Search</button>
      </form>

      {books.length === 0 ? (
        <p>No books found matching your criteria.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {books.map(book => (
            <div key={book.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <h4>{book.title}</h4>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Genre:</strong> {book.genre || 'N/A'}</p>
              <p><strong>Published:</strong> {book.publishedDate}</p>
              <p><strong>Available:</strong> {book.availableCopies} / {book.numberOfCopies}</p>
              <div style={{ marginTop: '10px' }}>
                <button
                    onClick={() => handleReadOnline(book.filePath)}
                    disabled={!book.filePath || book.fileStatus !== 'AVAILABLE'}
                    style={{ marginRight: '10px', backgroundColor: '#28a745' }}
                >
                    Read Online
                </button>
                {/* Integrate BorrowBookButton here */}
                {book.availableCopies > 0 && ( // Only show borrow button if copies are available
                    <BorrowBookButton
                        bookId={book.id}
                        onBorrowSuccess={handleBorrowSuccessInBrowse}
                        onBorrowError={handleBorrowErrorInBrowse} // <--- NEW: Pass error handler
                    />
                )}
                {book.availableCopies <= 0 && <p style={{ color: 'orange', display: 'inline-block', marginLeft: '10px' }}>No Copies Available</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: '20px' }}><a href="#" onClick={() => setActiveTab('userDashboardMain')}>Back to Dashboard</a></p>
    </div>
  );
}

export default BrowseBooks;