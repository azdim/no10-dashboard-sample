import os
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
from typing import Optional, List


class DatabaseManager:
    def __init__(self):
        self.database_url = os.getenv('DATABASE_URL', 'postgresql://dashboard_user:dashboard_password@localhost:5432/dashboard_db')
        self.connection = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
            return True
        except Exception as e:
            print(f"Database connection error: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def authenticate_user(self, username: str, password: str) -> Optional[dict]:
        """Authenticate user and return user info if successful"""
        if not self.connection:
            if not self.connect():
                return None
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id, username, created_at, last_login, is_active 
                    FROM users 
                    WHERE username = %s AND password_hash = %s AND is_active = TRUE
                """, (username, password_hash))
                
                user = cursor.fetchone()
                
                if user:
                    # Update last login
                    cursor.execute("""
                        UPDATE users 
                        SET last_login = CURRENT_TIMESTAMP 
                        WHERE id = %s
                    """, (user['id'],))
                    self.connection.commit()
                    
                    return dict(user)
                
                return None
        except Exception as e:
            print(f"Authentication error: {e}")
            return None
    
    def get_user_permissions(self, username: str) -> List[str]:
        """Get list of permissions for a user"""
        if not self.connection:
            if not self.connect():
                return []
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT p.name 
                    FROM permissions p
                    JOIN user_permissions up ON p.id = up.permission_id
                    JOIN users u ON u.id = up.user_id
                    WHERE u.username = %s AND u.is_active = TRUE
                """, (username,))
                
                permissions = cursor.fetchall()
                return [perm['name'] for perm in permissions]
        except Exception as e:
            print(f"Error getting permissions: {e}")
            return []
    
    def create_user(self, username: str, password: str) -> bool:
        """Create a new user"""
        if not self.connection:
            if not self.connect():
                return False
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO users (username, password_hash) 
                    VALUES (%s, %s)
                """, (username, password_hash))
                self.connection.commit()
                return True
        except Exception as e:
            print(f"Error creating user: {e}")
            return False
    
    def assign_permission(self, username: str, permission_name: str) -> bool:
        """Assign a permission to a user"""
        if not self.connection:
            if not self.connect():
                return False
        
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO user_permissions (user_id, permission_id)
                    SELECT u.id, p.id 
                    FROM users u, permissions p 
                    WHERE u.username = %s AND p.name = %s
                    ON CONFLICT (user_id, permission_id) DO NOTHING
                """, (username, permission_name))
                self.connection.commit()
                return True
        except Exception as e:
            print(f"Error assigning permission: {e}")
            return False

# Global database manager instance
db_manager = DatabaseManager()