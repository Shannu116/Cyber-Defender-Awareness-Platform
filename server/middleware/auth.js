import jwt from 'jsonwebtoken';
import AdminUser from '../models/AdminUser.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'cyber_defender_admin_super_secret_jwt_key_2025';

export async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Administrator authentication required. Please log in.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Missing authentication token.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check by ID or username to support seamless sessions even across in-memory DB restarts
    let admin = null;
    if (decoded.id) {
      admin = await AdminUser.findById(decoded.id).select('-passwordHash');
    }
    if (!admin && decoded.username) {
      admin = await AdminUser.findOne({ username: decoded.username }).select('-passwordHash');
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Administrator account not found or access revoked.'
      });
    }

    req.adminUser = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired administrator session.'
    });
  }
}
