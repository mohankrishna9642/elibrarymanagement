import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';

function AddUpdateBookForm({ bookToEdit, onClose, setMessage }) {
  const [form, setForm] = useState({
    bookTitle: '', author: '', genre: '', publishedDate: '', numberOfCopies: 1
  });
  const [bookFile, setBookFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

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
    if (bookToEdit) {
      setIsEditMode(true);
      setForm({
        bookTitle: bookToEdit.title || '',
        author: bookToEdit.author || '',
        genre: bookToEdit.genre || '',
        publishedDate: bookToEdit.publishedDate || '',
        numberOfCopies: bookToEdit.numberOfCopies || 1,
      });
      setBookFile(null);
    } else {
      setIsEditMode(false);
      setForm({ bookTitle: '', author: '', genre: '', publishedDate: '', numberOfCopies: 1 });
      setBookFile(null);
    }
  }, [bookToEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleFileChange = (e) => {
    setBookFile(e.target.files[0]);
    if (errors.bookFile) {
      setErrors({ ...errors, bookFile: '' });
    }
  };

  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    if (!form.bookTitle) { newErrors.bookTitle = 'Title is required.'; isValid = false; }
    if (!form.author) { newErrors.author = 'Author is required.'; isValid = false; }
    if (!form.publishedDate) { newErrors.publishedDate = 'Published Date is required.'; isValid = false; }
    if (form.numberOfCopies < 1) { newErrors.numberOfCopies = 'Copies must be at least 1.'; isValid = false; }

    if (!isEditMode && !bookFile) {
      newErrors.bookFile = 'Book file (PDF/EPUB) is required.';
      isValid = false;
    } else if (bookFile) {
        const allowedTypes = ['application/pdf', 'application/epub+zip'];
        if (!allowedTypes.includes(bookFile.type)) {
            newErrors.bookFile = 'Only PDF or EPUB files are allowed.';
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

    const formData = new FormData();
    formData.append('bookRequest', new Blob([JSON.stringify({
      title: form.bookTitle,
      author: form.author,
      genre: form.genre,
      publishedDate: form.publishedDate,
      numberOfCopies: form.numberOfCopies
    })], { type: 'application/json' }));

    if (bookFile) {
      formData.append('file', bookFile);
    }

    try {
      let response;
      if (isEditMode) {
        response = await authApi.put(`/books/${bookToEdit.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage(`Book "${response.data.title}" updated successfully!`);
      } else {
        response = await authApi.post('/books', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessage(`Book "${response.data.title}" added successfully!`);
      }
      onClose();
    } catch (err) {
      console.error("Error submitting book form:", err);
      setMessage(getErrorMessage(err), true);
    }
  };

  return (
    <div>
      <h2>{isEditMode ? 'Edit Book' : 'Add New Book'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Book Title:</label>
          <input type="text" name="bookTitle" value={form.bookTitle} onChange={handleChange} required />
          {errors.bookTitle && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.bookTitle}</span>}
        </div>
        <div>
          <label>Author:</label>
          <input type="text" name="author" value={form.author} onChange={handleChange} required />
          {errors.author && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.author}</span>}
        </div>
        <div>
          <label>Genre:</label>
          <input type="text" name="genre" value={form.genre} onChange={handleChange} />
        </div>
        <div>
          <label>Published Date:</label>
          <input type="date" name="publishedDate" value={form.publishedDate} onChange={handleChange} required />
          {errors.publishedDate && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.publishedDate}</span>}
        </div>
        <div>
          <label>Number of Copies (Licenses):</label>
          <input type="number" name="numberOfCopies" value={form.numberOfCopies} onChange={handleChange} min="1" required />
          {errors.numberOfCopies && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.numberOfCopies}</span>}
        </div>
        <div>
          <label>Book File (PDF/EPUB):</label>
          <input type="file" name="bookFile" accept=".pdf,.epub" onChange={handleFileChange} />
          {isEditMode && !bookFile && <p style={{ fontSize: '0.8em', color: '#666' }}>Leave empty to keep existing file.</p>}
          {errors.bookFile && <span style={{ color: 'red', fontSize: '0.9em' }}>{errors.bookFile}</span>}
        </div>
        <button type="submit">{isEditMode ? 'Update Book' : 'Add Book'}</button>
        <button type="button" onClick={onClose} style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>Cancel</button>
      </form>
    </div>
  );
}

export default AddUpdateBookForm;