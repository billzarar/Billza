from django.db import migrations

def run_seed_target_user(apps, schema_editor):
    try:
        from bills.seeder import seed_bills_for_user
        seed_bills_for_user(target_email="GBDF5GHLWU@stellar.billza.local")
    except Exception as e:
        print(f"Notice: automatic seed during migration bypassed: {e}")

def reverse_seed_target_user(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('bills', '0003_alter_bill_start_date'),
        ('payments', '0002_alter_paymentrecord_payer_address'),
        ('reminders', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(run_seed_target_user, reverse_seed_target_user),
    ]
