from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User as AuthUser
from .models import User

class AccessCodeBackend(BaseBackend):
    """
    Custom authentication backend that authenticates users by access_code
    """
    
    def authenticate(self, request, access_code=None, **kwargs):
        if access_code is None:
            return None
        
        try:
            # Find our custom user by access code
            custom_user = User.objects.get(access_code=access_code)
            
            # Get or create the corresponding Django auth user
            auth_user, created = AuthUser.objects.get_or_create(
                username=custom_user.access_code,
                defaults={
                    'first_name': custom_user.full_name,
                    'is_active': True,
                }
            )
            
            return auth_user
        except User.DoesNotExist:
            return None
    
    def get_user(self, user_id):
        try:
            return AuthUser.objects.get(pk=user_id)
        except AuthUser.DoesNotExist:
            return None 