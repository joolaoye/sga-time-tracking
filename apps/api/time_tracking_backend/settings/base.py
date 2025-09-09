"""
Base Django settings for time_tracking_backend project.
Shared settings that apply to all environments.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('DJANGO_SECRET_KEY environment variable is required')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'core',  # our main app
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'core.middleware.IPRestrictionMiddleware',  # Add IP restriction middleware
    'core.middleware.AppSpecificSessionMiddleware',  # Apply app-specific session config
    'django.contrib.sessions.middleware.SessionMiddleware',  # Standard session middleware
    'django.middleware.common.CommonMiddleware',
    'core.middleware.CsrfExemptApiMiddleware',  # Add our custom middleware first
    'core.middleware.CsrfViewMiddlewareExempt',  # Use our custom CSRF middleware
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'time_tracking_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'time_tracking_backend.wsgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Custom authentication backend
AUTHENTICATION_BACKENDS = [
    'core.auth.AccessCodeBackend',
    'django.contrib.auth.backends.ModelBackend',  # Fallback
]

# Session settings - improved security configuration
SESSION_ENGINE = 'core.session'  # Use custom session store for app-specific sessions
SESSION_COOKIE_HTTPONLY = True  # SECURITY: Prevent XSS attacks by blocking JS access
SESSION_SAVE_EVERY_REQUEST = True  # Update session on every request

# Separate session configurations for different app contexts
CLOCK_APP_SESSION_CONFIG = {
    'SESSION_COOKIE_NAME': 'clock_sessionid',
    'SESSION_COOKIE_AGE': 120,  # 2 minutes for shared kiosk devices
    'SESSION_EXPIRE_AT_BROWSER_CLOSE': True,  # Always expire on browser close
    'SESSION_COOKIE_HTTPONLY': True,  # SECURITY: Prevent XSS attacks
    'SESSION_COOKIE_SAMESITE': 'Strict',  # SECURITY: Strict for kiosk mode
    'SESSION_COOKIE_PATH': '/api/',  # Restrict cookie to API endpoints
    'SESSION_COOKIE_DOMAIN': None,  # Use current domain only
}

HUB_APP_SESSION_CONFIG = {
    'SESSION_COOKIE_NAME': 'hub_sessionid',
    'SESSION_COOKIE_AGE': 3600,  # 1 hour sliding inactivity window
    'SESSION_EXPIRE_AT_BROWSER_CLOSE': False,  # Persistent sessions for staff
    'SESSION_COOKIE_HTTPONLY': True,  # SECURITY: Prevent XSS attacks
    'SESSION_COOKIE_SAMESITE': 'Lax',  # Allow navigation from external sites
    'SESSION_COOKIE_PATH': '/api/',  # Restrict cookie to API endpoints
    'SESSION_COOKIE_DOMAIN': None,  # Use current domain only
}

# Absolute lifetime cap for Hub sessions (seconds)
HUB_ABSOLUTE_SESSION_AGE = int(os.getenv('HUB_ABSOLUTE_SESSION_AGE', str(12 * 3600)))

# CORS settings - base configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Keep this False for security
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'cache-control',  # Allow cache-control header
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cookie',  # Allow cookie header
    'x-app-type',  # Allow app type header for session isolation
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
