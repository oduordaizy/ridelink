from django.contrib import admin
from .models import Ride, Booking, RideImage

# Register your models here.
admin.site.register(Ride)
admin.site.register(RideImage)
admin.site.register(Booking)