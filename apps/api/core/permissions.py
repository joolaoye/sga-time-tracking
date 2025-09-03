from rest_framework import permissions
from .models import User


class IsMember(permissions.BasePermission):
    """
    Allow access only to members (basic users).
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            custom_user = User.objects.get(access_code=request.user.username)
            return custom_user.role in ['member', 'chair', 'admin']
        except User.DoesNotExist:
            return False


class IsChair(permissions.BasePermission):
    """
    Allow access only to chairs and admins.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            custom_user = User.objects.get(access_code=request.user.username)
            return custom_user.role in ['chair', 'admin']
        except User.DoesNotExist:
            return False


class IsAdmin(permissions.BasePermission):
    """
    Allow access only to admins.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            custom_user = User.objects.get(access_code=request.user.username)
            return custom_user.role == 'admin'
        except User.DoesNotExist:
            return False


class IsOwnerOrChair(permissions.BasePermission):
    """
    Allow access to the owner of the resource or chairs/admins.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            custom_user = User.objects.get(access_code=request.user.username)
            return custom_user.role in ['member', 'chair', 'admin']
        except User.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            custom_user = User.objects.get(access_code=request.user.username)
            
            # Admins and chairs can access any object
            if custom_user.role in ['chair', 'admin']:
                return True
            
            # Members can only access their own objects
            if hasattr(obj, 'user_id'):
                return obj.user_id == custom_user.id
            elif hasattr(obj, 'user'):
                return obj.user.id == custom_user.id
            
            return False
        except User.DoesNotExist:
            return False


class IsTeamMemberOrChair(permissions.BasePermission):
    """
    Allow access to team members or chairs/admins.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            custom_user = User.objects.get(access_code=request.user.username)
            return custom_user.role in ['member', 'chair', 'admin']
        except User.DoesNotExist:
            return False 