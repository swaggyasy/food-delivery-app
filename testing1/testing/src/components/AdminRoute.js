import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const AdminRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser || !auth.currentUser) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.isAdmin === true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAdminStatus();
  }, [currentUser]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser || !auth.currentUser || !isAdmin) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default AdminRoute;