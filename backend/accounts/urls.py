from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserProfileView, ProfileView, 
    logout, send_otp, verify_otp, SwitchRoleView,
    forgot_password, reset_password
)

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout, name='logout'),

    path('send-otp/', send_otp, name='send_otp'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('forgot-password/', forgot_password, name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('switch-role/', SwitchRoleView.as_view(), name='switch_role'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]