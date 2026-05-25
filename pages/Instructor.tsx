import React from 'react';
import { Navigate } from 'react-router-dom';

export const Instructor: React.FC = () => {
  // This page is deprecated. All instructor actions should happen via the Dashboard.
  return <Navigate to="/dashboard" replace />;
};