"""
Development Django settings for time_tracking_backend project.
"""

import os
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Allowed hosts for development
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', 'api']

# Parse additional allowed hosts from environment
allowed_hosts_env = os.getenv('DJANGO_ALLOWED_HOSTS', '')
if allowed_hosts_env:
    additional_hosts = [host.strip() for host in allowed_hosts_env.split(',') if host.strip()]
    ALLOWED_HOSTS.extend(additional_hosts)

# Database configuration for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'sga_time_tracking'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'db'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Clock Kiosk
    "http://localhost:3001",  # Members Hub
    "http://localhost:3002",  # Additional dev port
    "http://127.0.0.1:3000",  # Alternative localhost
    "http://127.0.0.1:3001",  # Alternative localhost
]

# Session settings for development
SESSION_COOKIE_SECURE = False  # Allow HTTP in development
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = int(os.getenv('SESSION_COOKIE_AGE', '3600'))  # 1 hour
SESSION_EXPIRE_AT_BROWSER_CLOSE = os.getenv('SESSION_EXPIRE_AT_BROWSER_CLOSE', 'True').lower() == 'true'

# Update app-specific session configs for development
CLOCK_APP_SESSION_CONFIG.update({
    'SESSION_COOKIE_SECURE': False,
})

HUB_APP_SESSION_CONFIG.update({
    'SESSION_COOKIE_SECURE': False,
})

# Development-specific apps (if any)
INSTALLED_APPS += [
    # Add development-specific apps here if needed
    # 'debug_toolbar',  # Uncomment if you want to use Django Debug Toolbar
]

# Development-specific middleware
# MIDDLEWARE += [
#     'debug_toolbar.middleware.DebugToolbarMiddleware',  # Uncomment if using Debug Toolbar
# ]

# Internal IPs for debug toolbar (if enabled)
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# Disable security features in development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0

# Email backend for development (console output)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Logging configuration for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'core': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
