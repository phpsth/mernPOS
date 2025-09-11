import React from 'react';

const RoleGuard = ({ 
  user,           // Receive user as props instead of Context
  allowedRoles = [], 
  fallback = null,
  children 
}) => {
  // Check if user has required role
  const hasPermission = () => {
    if (!user || !allowedRoles.length) return false;
    
    // Role hierarchy check
    const roleHierarchy = { admin: 3, manager: 2, cashier: 1 };
    const userLevel = roleHierarchy[user.role] || 0;
    
    return allowedRoles.some(role => {
      const requiredLevel = roleHierarchy[role] || 0;
      return userLevel >= requiredLevel;
    });
  };

  return hasPermission() ? children : (fallback || null);
};

export default RoleGuard;