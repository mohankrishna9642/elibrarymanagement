// src/services/borrowService.js
import { authApi } from './api'; // IMPORTANT: Using your existing authApi for JWT handling

/**
 * Borrows a book for the current user.
 * Sends a POST request to the Gateway via authApi, which routes to Borrowing Service.
 * The userId is typically derived from the JWT on the backend for security,
 * but can be passed in the body if your backend explicitly expects it there.
 * @param {string} bookId - The ID of the book to borrow.
 * @param {string} userId - The ID of the user borrowing the book (passed from frontend component).
 * @returns {Promise<Object>} The borrowing record created.
 */
const borrowBook = async (bookId, userId) => { // Keep userId here if your backend POST /borrows expects it in body
  try {
    // Assuming your backend expects bookId and userId in the request body
    // and validates userId against the JWT.
    const response = await authApi.post('/borrows', { bookId, userId });
    console.log('Book borrowed successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error borrowing book:', error.response ? error.response.data : error.message);
    throw error; // Re-throw for handling in the calling component
  }
};

/**
 * Returns a previously borrowed book.
 * Sends a PUT request to the Gateway via authApi, which routes to Borrowing Service.
 * @param {string} borrowId - The ID of the borrowing record to mark as returned.
 * @returns {Promise<Object>} The updated borrowing record.
 */
const returnBook = async (borrowId) => {
  try {
    const response = await authApi.put(`/borrows/${borrowId}/return`, {});
    console.log('Book returned successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error returning book:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches all books borrowed by the current authenticated user.
 * Sends a GET request to the Gateway via authApi, which routes to Borrowing Service.
 * The backend (Borrowing Service) will identify the user from the JWT in the SecurityContextHolder,
 * so no userId parameter is needed in the frontend API call itself.
 * @returns {Promise<Array<Object>>} A list of borrowing records for the current user.
 */
const getUserBorrows = async () => { // <--- MODIFIED: Removed userId from signature here
  try {
    const response = await authApi.get(`/borrows/my-borrows`); // <--- MODIFIED: Endpoint corrected
    console.log('User borrows fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user borrows:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches all borrowing records (e.g., for admin view).
 * Sends a GET request to the Gateway via authApi, which routes to Borrowing Service.
 * Requires appropriate authorization on the backend (handled by Gateway/Borrowing Service security).
 * @returns {Promise<Array<Object>>} A list of all borrowing records.
 */
const getAllBorrows = async () => {
  try {
    const response = await authApi.get('/borrows/admin/all'); // Assuming this is your admin endpoint
    console.log('All borrows fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching all borrows:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export {
  borrowBook,
  returnBook,
  getUserBorrows,
  getAllBorrows,
};