import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function Header({ setActiveTab, activeTab }) {
  const { isLoggedIn, currentUser, logout, isAdmin } = useAuth();
  const [showUserOptions, setShowUserOptions] = useState(false);

  const handleUserIconClick = () => {
    setShowUserOptions(!showUserOptions);
  };

  const handleOptionClick = (tabName) => {
    setActiveTab(tabName);
    setShowUserOptions(false);
  };

  const isTabActive = (tabName) => {
    return activeTab === tabName;
  };

  return (
    <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>E-Library Application</h1>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isLoggedIn ? (
          <>
            <button onClick={() => handleOptionClick('userDashboardMain')} className={isTabActive('userDashboardMain') ? 'active-tab' : ''}>Dashboard</button>
            <button onClick={() => handleOptionClick('browseBooks')} className={isTabActive('browseBooks') ? 'active-tab' : ''}>Browse Books</button>
            <button onClick={() => handleOptionClick('userHistory')} className={isTabActive('userHistory') ? 'active-tab' : ''}>My Borrowings</button>

            {isAdmin && (
              <>
                <button onClick={() => handleOptionClick('adminUsers')} className={isTabActive('adminUsers') ? 'active-tab' : ''}>Manage Users</button>
                <button onClick={() => handleOptionClick('adminBooks')} className={isTabActive('adminBooks') ? 'active-tab' : ''}>Manage Books</button>
                <button onClick={() => handleOptionClick('adminAllBorrows')} className={isTabActive('adminAllBorrows') ? 'active-tab' : ''}>All Borrowings</button>
              </>
            )}

            <div style={{ position: 'relative', marginLeft: '20px' }}>
              <button
                onClick={handleUserIconClick}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', color: '#007bff'
                }}
                title={currentUser ? currentUser.email : 'User'}
              >
                <span style={{ fontSize: '24px', marginRight: '5px' }}>👤</span>
                {currentUser ? currentUser.name : 'User'}
              </button>

              {showUserOptions && (
                <div style={{
                  position: 'absolute', right: '0', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: '100', minWidth: '150px'
                }}>
                  <button
                    onClick={() => handleOptionClick('userProfileUpdate')}
                    style={{ display: 'block', width: '100%', textAlign: 'left', borderBottom: '1px solid #eee', borderRadius: '0' }}
                  >
                    My Profile
                  </button>
                  <button
                    onClick={logout}
                    style={{ display: 'block', width: '100%', textAlign: 'left', backgroundColor: 'transparent', color: '#dc3545', borderRadius: '0 0 5px 5px' }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => handleOptionClick('login')} className={isTabActive('login') ? 'active-tab' : ''}>Login</button>
            <button onClick={() => handleOptionClick('register')} className={isTabActive('register') ? 'active-tab' : ''}>Register</button>
          </>
        )}
      </nav>
    </div>
  );
}

export default Header;