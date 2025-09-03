from django.contrib.sessions.backends.db import SessionStore as DBStore
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import threading

# Thread-local storage for app_type context
_thread_locals = threading.local()


def set_app_type(app_type):
    """Set the app type for the current thread/request"""
    _thread_locals.app_type = app_type


def get_app_type():
    """Get the app type for the current thread/request"""
    return getattr(_thread_locals, 'app_type', None)


class SessionStore(DBStore):
    """
    Custom session store that applies app-specific session configurations.
    This ensures that clock app sessions are isolated from hub app sessions.
    """
    
    def __init__(self, session_key=None):
        super().__init__(session_key)
        # Get the app type from thread-local storage
        self.app_type = get_app_type()
    
    def _get_session_config(self):
        """Get the appropriate session configuration based on app type"""
        if self.app_type == 'clock':
            return getattr(settings, 'CLOCK_APP_SESSION_CONFIG', {})
        elif self.app_type == 'hub':
            return getattr(settings, 'HUB_APP_SESSION_CONFIG', {})
        else:
            # Default to clock app config for security (shorter sessions)
            return getattr(settings, 'CLOCK_APP_SESSION_CONFIG', {})
    
    def create(self):
        """Create a new session with app-specific configuration"""
        super().create()
        config = self._get_session_config()
        
        # Set session expiry based on app configuration
        if 'SESSION_COOKIE_AGE' in config:
            self.set_expiry(config['SESSION_COOKIE_AGE'])
        
        # For hub sessions, also set an absolute expiry cap
        if self.app_type == 'hub':
            absolute_age_seconds = getattr(settings, 'HUB_ABSOLUTE_SESSION_AGE', 12 * 3600)
            self['_abs_exp'] = (timezone.now() + timedelta(seconds=absolute_age_seconds)).timestamp()
        
        # Store app type in session for later reference
        self['_app_type'] = self.app_type
        
        # Mark session as modified to ensure it's saved
        self.modified = True
    
    def save(self, must_create=False):
        """Save session with app-specific configuration"""
        config = self._get_session_config()
        
        # Apply app-specific settings before saving
        # Make clock sessions non-sliding by NOT resetting expiry on save
        if self.app_type != 'clock' and 'SESSION_COOKIE_AGE' in config:
            self.set_expiry(config['SESSION_COOKIE_AGE'])
        
        # Ensure app type is stored in session
        if '_app_type' not in self:
            self['_app_type'] = self.app_type
        
        super().save(must_create)
    
    def load(self):
        """Load session and restore app type"""
        session_data = super().load()
        
        # Restore app type from session if available
        if '_app_type' in session_data:
            self.app_type = session_data['_app_type']
        
        # Enforce absolute expiry for hub sessions
        if session_data.get('_app_type') == 'hub':
            abs_exp = session_data.get('_abs_exp')
            if abs_exp and timezone.now().timestamp() > abs_exp:
                try:
                    self.delete()
                except Exception:
                    pass
                return {}
        
        return session_data