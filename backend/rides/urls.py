# rides/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'rides', views.RideViewSet, basename='ride')
router.register(r'bookings', views.BookingViewSet, basename='booking')
# router.register(r'payments', views.PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    
    # # Additional endpoints
    # path('search/rides/', views.RideViewSet.as_view({'get': 'list'}), name='search-rides'),
    # path('my-rides/', views.RideViewSet.as_view({'get': 'list'}), name='my-rides'),
    # path('my-bookings/', views.BookingViewSet.as_view({'get': 'list'}), name='my-bookings'),
    # path('bookings/<int:pk>/cancel/', views.BookingViewSet.as_view({'post': 'cancel'}), name='cancel-booking'),
    # path('bookings/<int:pk>/confirm/', views.BookingViewSet.as_view({'post': 'confirm'}), name='confirm-booking'),
    # path('payments/<int:pk>/refund/', views.PaymentViewSet.as_view({'post': 'refund'}), name='refund-payment'),
]