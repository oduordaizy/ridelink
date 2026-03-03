from django.db import migrations


def copy_receipt_to_reference(apps, schema_editor):
    Transaction = apps.get_model('payments', 'Transaction')
    for tx in Transaction.objects.filter(mpesa_transaction_reference__isnull=True).exclude(mpesa_receipt_number__isnull=True):
        tx.mpesa_transaction_reference = tx.mpesa_receipt_number
        tx.save(update_fields=['mpesa_transaction_reference'])


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0006_mpesa_transaction_reference'),
    ]

    operations = [
        migrations.RunPython(copy_receipt_to_reference, reverse_code=migrations.RunPython.noop),
    ]
