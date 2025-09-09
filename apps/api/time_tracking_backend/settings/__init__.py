"""
Django settings module selector.

This module automatically selects the appropriate settings based on the DJANGO_ENV environment variable.
- 'production': Uses production.py settings
- 'development' or unset: Uses development.py settings
"""

import os

# Determine which settings to use based on environment
DJANGO_ENV = os.getenv('DJANGO_ENV', 'development').lower()

if DJANGO_ENV == 'production':
    from .production import *
else:
    from .development import *
