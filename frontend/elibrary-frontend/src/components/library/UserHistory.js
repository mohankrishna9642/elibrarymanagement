// src/components/library/UserHistory.jsx
import React from 'react';
import MyBorrows from '../MyBorrows'; // <--- NEW IMPORT: MyBorrows component

function UserHistory({ setActiveTab, setMessage }) {
  // UserHistory now acts as a wrapper for MyBorrows.
  // MyBorrows internally handles fetching and displaying the user's borrowed books.
  return (
    <div>
      {/* <h2>My Borrowed Books</h2> Removed as MyBorrows has its own heading */}
      <MyBorrows /> {/* <--- RENDER THE MYBORROWS COMPONENT HERE */}
      <p style={{ marginTop: '20px' }}><a href="#" onClick={() => setActiveTab('userDashboardMain')}>Back to Dashboard</a></p>
    </div>
  );
}

export default UserHistory;