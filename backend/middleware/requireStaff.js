const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.userType !== 'staff') {
    return res.status(403).json({ message: 'Access denied: Staff role required' });
  }

  next();
};

module.exports = requireStaff;
