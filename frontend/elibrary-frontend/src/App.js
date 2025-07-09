import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
// No direct use of authApi here, it's used within AuthContext and borrowService

import Header from './components/common/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/common/Dashboard';
import UserProfile from './components/auth/UserProfile';
import AdminUsers from './components/admin/AdminUsers';
import BrowseBooks from './components/library/BrowseBooks';
import UserHistory from './components/library/UserHistory'; // This now renders MyBorrows
import AdminBooks from './components/library/AdminBooks';
// Import the new AdminAllBorrows component
import AdminAllBorrows from './components/admin/AdminAllBorrows'; // <--- NEW IMPORT


function AppContent() {
  const { isLoggedIn, isAdmin, loading, currentUser, logout, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [message, setMessage] = useState('');

  const displayMessage = useCallback((msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');

    const performInitialSetup = async () => {
      if (!loading) { // Only run if AuthContext has finished its initial loading phase
        if (isLoggedIn) {
          if (activeTab === 'login' || activeTab === 'register') {
            setActiveTab('userDashboardMain');
          }
        } else {
          if (activeTab !== 'login' && activeTab !== 'register') {
            setActiveTab('login');
          }
        }
      }
    };
    performInitialSetup();
  }, [loading, isLoggedIn, activeTab]);

  useEffect(() => {
    if (!loading && isLoggedIn && currentUser) {
      displayMessage('Welcome back!');
    }
  }, [loading, isLoggedIn, currentUser, displayMessage]);


  const renderContent = () => {
    if (loading) {
      return <p>Loading application...</p>;
    }

    if (!isLoggedIn) {
      switch (activeTab) {
        case 'register':
          return <Register onSwitchToLogin={() => setActiveTab('login')} setMessage={displayMessage} />;
        case 'login':
        default:
          return <Login onSwitchToRegister={() => setActiveTab('register')} onLoginSuccess={() => setActiveTab('userDashboardMain')} setMessage={displayMessage} />;
      }
    } else {
      switch (activeTab) {
        case 'userDashboardMain':
          return <Dashboard setActiveTab={setActiveTab} />;
        case 'browseBooks':
          return <BrowseBooks setActiveTab={setActiveTab} setMessage={displayMessage} />;
        case 'userHistory':
          return <UserHistory setActiveTab={setActiveTab} setMessage={displayMessage} />;
        case 'userProfileUpdate':
          return <UserProfile setActiveTab={setActiveTab} setMessage={displayMessage} />;
        case 'adminUsers':
          return <AdminUsers onBackToDashboard={() => setActiveTab('userDashboardMain')} setMessage={displayMessage} />;
        case 'adminBooks':
          return <AdminBooks onBackToDashboard={() => setActiveTab('userDashboardMain')} setMessage={displayMessage} />;
        case 'adminAllBorrows':
          // Render the new AdminAllBorrows component
          return <AdminAllBorrows onBackToDashboard={() => setActiveTab('userDashboardMain')} setMessage={displayMessage} />; // <--- MODIFIED
        default:
          return <Dashboard setActiveTab={setActiveTab} />;
      }
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: 'auto', border: '1px solid #ccc', borderRadius: '8px' }}>
      <Header setActiveTab={setActiveTab} activeTab={activeTab} />

      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', minHeight: '300px' }}>
        {message && <p className="shaking-text" style={{ color: message.includes('failed') || message.includes('denied') || message.includes('error') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</p>}
        {renderContent()}
      </div>

      {/* Global CSS Styles (keep existing styles and new ones for borrows-grid/borrow-card) */}
      <style>{`
        /* General Button Styles */
        button {
          padding: 10px 15px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #0056b3;
        }
        button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        button.active-tab {
          background-color: #28a745;
        }
        button.active-tab:hover {
          background-color: #218838;
        }

        /* Form Styles */
        form div {
          margin-bottom: 15px;
        }
        form label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        form input[type="email"],
        form input[type="text"],
        form input[type="password"],
        form input[type="date"],
        form input[type="number"],
        form input[type="file"] {
          width: calc(100% - 22px); /* Account for padding and border */
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }
        form input[type="file"] {
            width: auto; /* Adjust for file input */
        }


        /* Table Styles */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        table th, table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        /* Shaking Text Animation for Messages */
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
        .shaking-text {
            animation: shake 0.3s ease-in-out 2;
        }

        /* Borrowed Books Grid and Card Styles */
        .borrows-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
          background-color: #f8f9fa; /* Light background for the grid area */
          border-radius: 8px;
          margin-top: 20px; /* Add some space from the heading */
        }

        .borrow-card {
          background-color: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between; /* Pushes button to bottom if content varies */
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }

        .borrow-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
        }

        .borrow-card h4 {
          margin-top: 0;
          color: #343a40;
          font-size: 1.4em;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }

        .borrow-card p {
          margin: 8px 0;
          color: #555;
          font-size: 0.95em;
        }

        .borrow-card p strong {
          color: #333;
        }

        .borrow-card .status {
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 5px;
          display: inline-block;
          margin-left: 5px;
        }

        /* Specific status colors */
        .borrow-card .status.BORROWED {
          background-color: #e0f7fa; /* Light blue */
          color: #007bb6; /* Darker blue */
          border: 1px solid #007bb6;
        }
        .borrow-card .status.RETURNED {
          background-color: #e8f5e9; /* Light green */
          color: #4CAF50; /* Green */
          border: 1px solid #4CAF50;
        }
        .borrow-card .status.OVERDUE {
          background-color: #ffe0b2; /* Light orange */
          color: #FF9800; /* Orange */
          border: 1px solid #FF9800;
        }

        .borrow-card button {
          margin-top: 15px;
          width: 100%;
          padding: 10px;
          background-color: #dc3545; /* Red for return */
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          transition: background-color 0.2s ease;
        }

        .borrow-card button:hover {
          background-color: #c82333;
        }
      `}</style>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;