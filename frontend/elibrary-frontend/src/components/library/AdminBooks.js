import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import AddUpdateBookForm from './AddUpdateBookForm'; // Correct Import: AddUpdateBookForm is in the same 'library' folder
import { useAuth } from '../../context/AuthContext';

function AdminBooks({ onBackToDashboard, setMessage }) {
  const { isAdmin } = useAuth();
  const [booksList, setBooksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

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

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.get('/books/admin/all');
      setBooksList(response.data.content);
    } catch (err) {
      console.error("Error fetching admin books:", err);
      setError(getErrorMessage(err));
      setBooksList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showAddForm) {
      fetchBooks();
    }
  }, [showAddForm]);

  const handleDeleteBook = async (id) => {
    setMessage('');
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      try {
        const response = await authApi.delete(`/books/${id}`);
        setMessage(response.data);
        fetchBooks();
      } catch (err) {
        console.error(`Error deleting book ${id}:`, err);
        setMessage(getErrorMessage(err), true);
      }
    }
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowAddForm(true);
  };

  const handleFormClose = () => {
    setShowAddForm(false);
    setEditingBook(null);
    fetchBooks();
  };

  if (!isAdmin) {
      return <p style={{ color: 'red' }}>Access Denied: Only administrators can manage books.</p>;
  }
  if (loading) return <p>Loading books...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  if (showAddForm) {
    return (
      <AddUpdateBookForm
        bookToEdit={editingBook}
        onClose={handleFormClose}
        setMessage={setMessage}
      />
    );
  }

  return (
    <div>
      <h2>Admin: Book Management</h2>

      <button onClick={() => setShowAddForm(true)} style={{ marginBottom: '20px' }}>Add New Book</button>
      {booksList.length === 0 && !loading ? (
        <p>No books found in the library.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>Published Date</th>
              <th>Copies (Available/Total)</th>
              <th>File Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {booksList.map(book => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.genre || 'N/A'}</td>
                <td>{book.publishedDate}</td>
                <td>{book.availableCopies} / {book.numberOfCopies}</td>
                <td>{book.fileStatus}</td>
                <td>
                  <button onClick={() => handleEditBook(book)} style={{ marginRight: '10px', backgroundColor: '#ffc107', color: 'black' }}>Edit</button>
                  <button onClick={() => handleDeleteBook(book.id)} style={{ backgroundColor: '#dc3545' }}>Delete</button>
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

export default AdminBooks;