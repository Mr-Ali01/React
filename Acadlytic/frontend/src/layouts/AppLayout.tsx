import React from 'react';
import { Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  return (
    <div className="space-y-6">
      <Outlet />
    </div>
  );
};
