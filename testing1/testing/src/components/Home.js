import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <nav>
        <Link to="/signup">Sign Up</Link>
        <Link to="/login">Login</Link>
      </nav>
    </div>
  );
};

export default Home;