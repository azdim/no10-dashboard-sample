-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create permissions table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions junction table
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, permission_id)
);

-- Insert permissions
INSERT INTO permissions (name, description) VALUES 
    ('customer-analytics', 'Access to customer analytics dashboard'),
    ('sales-dashboard', 'Access to sales performance dashboard'),
    ('financial-reports', 'Access to financial reports dashboard');

-- Insert dummy users with hashed passwords
-- admin: password123 -> SHA256: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
-- analyst1: analyst123 -> SHA256: 20249749412d73a3f5799f6f1dcf910e7b4aa3ce4de133b1f8a63c044792a4e9
-- scientist1: science123 -> SHA256: f2561f567b862c9a3d557f3091c4902fade246a2136966c885ce177843120485
INSERT INTO users (username, password_hash) VALUES 
    ('admin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'),
    ('analyst1', '20249749412d73a3f5799f6f1dcf910e7b4aa3ce4de133b1f8a63c044792a4e9'),
    ('scientist1', 'f2561f567b862c9a3d557f3091c4902fade246a2136966c885ce177843120485');

-- Assign permissions to users
-- Admin gets all permissions
INSERT INTO user_permissions (user_id, permission_id) 
SELECT u.id, p.id 
FROM users u, permissions p 
WHERE u.username = 'admin';

-- Analyst1 gets sales-dashboard and financial-reports
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id 
FROM users u, permissions p 
WHERE u.username = 'analyst1' AND p.name IN ('sales-dashboard', 'financial-reports');

-- Scientist1 gets customer-analytics only
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id 
FROM users u, permissions p 
WHERE u.username = 'scientist1' AND p.name = 'customer-analytics';

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission_id ON user_permissions(permission_id);