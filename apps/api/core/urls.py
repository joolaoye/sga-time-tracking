from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, TimeLogViewSet, LoginView, LogoutView, MeView,
    TeamViewSet, AdminViewSet, ChairViewSet, AllowedIPViewSet, IpCheckView,
    CommitteeViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'time-logs', TimeLogViewSet)
router.register(r'team', TeamViewSet, basename='team')
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'chair', ChairViewSet, basename='chair')
router.register(r'allowed-ips', AllowedIPViewSet, basename='allowed-ips')
router.register(r'committees', CommitteeViewSet, basename='committees')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),
    path('ip-check/', IpCheckView.as_view(), name='ip-check'),
] 