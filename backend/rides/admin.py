from django.contrib import admin
from .models import Ride, Booking, RideImage
from payments.models import Wallet, Transaction

# Register your models here.
admin.site.register(Ride)
admin.site.register(RideImage)
admin.site.register(Booking)
admin.site.register(Wallet)
admin.site.register(Transaction)