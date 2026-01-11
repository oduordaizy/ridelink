from django.db import models
from accounts.models import User

class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=2600.00)

    def __str__(self):
        return f"{self.user.username}'s Wallet - {self.balance}"
    
    def top_up(self, amount):
        self.balance += amount
        self.save()
    

class Transaction(models.Model):
    wallet=models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    mpesa_receipt_number = models.CharField(max_length=100, blank=True, null=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    merchant_request_id = models.CharField(max_length=100, blank=True, null=True)
    result_code = models.IntegerField(null=True, blank=True)
    result_desc = models.TextField(null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status= models.CharField(max_length=50, choices=[("pending", "Pending"), ("success", "Success"), ("failed", "Failed")], default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.wallet.user.username} - {self.amount} - {self.status}"