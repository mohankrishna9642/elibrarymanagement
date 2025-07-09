import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Dashboard({ setActiveTab }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) return <p>Loading dashboard...</p>;
  if (!currentUser) return <p>Error: User not logged in.</p>;

  return (
    <div>
      <h3>Welcome back, {currentUser.name}!</h3>
      <p>This is your personalized E-Library dashboard. From here you can explore books, view your borrowings, or manage your account details.</p>

      <h4>Quick Actions:</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('browseBooks')}>Browse E-Books</button>
        <button onClick={() => setActiveTab('userHistory')}>View My Borrowings</button>
      </div>

      {isAdmin && (
        <>
          <h4>Admin Panel:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            <button onClick={() => setActiveTab('adminUsers')}>Manage Users</button>
            <button onClick={() => setActiveTab('adminBooks')}>Manage Books</button>
            <button onClick={() => setActiveTab('adminAllBorrows')}>All Borrowed Overview</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;