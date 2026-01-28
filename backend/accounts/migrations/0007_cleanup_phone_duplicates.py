import django.core.validators
from django.db import migrations, models
from django.db.models import Count

def cleanup_duplicate_phones(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    
    # Find duplicate phone numbers (excluding None/empty)
    duplicates = User.objects.values('phone_number') \
                             .annotate(count=Count('id')) \
                             .filter(count__gt=1) \
                             .exclude(phone_number__isnull=True) \
                             .exclude(phone_number='')

    for entry in duplicates:
        phone = entry['phone_number']
        # Get all users with this phone number, sorted by ID (keep oldest)
        users = User.objects.filter(phone_number=phone).order_by('id')
        
        # Keep the first user, set phone_number to None for the rest
        duplicate_users = users[1:]
        for user in duplicate_users:
            user.phone_number = None
            user.save(update_fields=['phone_number'])

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_user_is_verified_user_otp_user_otp_created_at'),
    ]

    operations = [
        # First make the field nullable so we can set duplicates to None
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(
                blank=True, 
                max_length=15, 
                null=True, 
                validators=[django.core.validators.RegexValidator(message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.", regex='^\\+?1?\\d{9,15}$')]
            ),
        ),
        # Then clean up the duplicates
        migrations.RunPython(cleanup_duplicate_phones),
    ]
