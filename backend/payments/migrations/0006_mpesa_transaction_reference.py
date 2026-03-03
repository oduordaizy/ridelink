# Generated manually to add transaction reference field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0005_transaction_booking'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='mpesa_transaction_reference',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
