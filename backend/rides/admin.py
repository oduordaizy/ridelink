from django.contrib import admin
from .models import Ride, Booking
from payments.models import Wallet, Transaction

# Register your models here.
admin.site.register(Ride)
admin.site.register(Booking)
admin.site.register(Wallet)
admin.site.register(Transaction)