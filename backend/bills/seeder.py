"""
Billza User Bill & Payment History Seeder.
Populates realistic bills, recurring occurrences, verified payment history records, and reminders
for a given user (such as wallet-authenticated users like GBDF5GHLWU@stellar.billza.local).
"""

import uuid
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from bills.models import Bill, BillOccurrence, BillCategory, BillFrequency, AssetType, OccurrenceStatus
from payments.models import PaymentRecord, PaymentMethod, VerificationStatus
from reminders.models import Reminder, NotificationPreference, ReminderType, ReminderChannel, ReminderStatus
from reminders.services import process_scheduled_reminders

User = get_user_model()

def seed_bills_for_user(target_email="GBDF5GHLWU@stellar.billza.local", target_wallet=None):
    """
    Populates bills, occurrences, payment history, and reminders for the specified user email or wallet.
    Idempotent: updates or creates without corrupting existing records.
    """
    prefix = target_email.split('@')[0] if '@' in target_email else "GBDF5GHLWU"
    if not target_wallet:
        target_wallet = f"{prefix}Q6E4A2K76YPX9J84M5V10Z3B8NC7K2PLAQ9876543210AB"[:56]

    # 1. Locate or create User
    user = User.objects.filter(email__iexact=target_email).first()
    if not user:
        # Check by wallet in UserProfile
        from core.models import UserProfile
        profile_match = UserProfile.objects.filter(wallet_address__startswith=prefix[:10]).first()
        if profile_match:
            user = profile_match.user
        else:
            username = f"stellar_{prefix[:8]}_{target_wallet[-4:]}"
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': target_email,
                    'first_name': 'Stellar',
                    'last_name': 'Subscriber',
                }
            )
            user.set_password('BillzaStellar2026!')
            user.save()

    # Ensure profile
    profile = getattr(user, 'profile', None)
    if profile:
        if not profile.wallet_address:
            profile.wallet_address = target_wallet
        profile.preferred_currency = 'USDC'
        profile.save()

    NotificationPreference.objects.get_or_create(
        user=user,
        defaults={
            'email_enabled': True,
            'in_app_enabled': True,
            'remind_7_days': True,
            'remind_3_days': True,
            'remind_1_day': True,
            'remind_on_due': True,
            'remind_overdue': True,
        }
    )

    today = timezone.now().date()
    now = timezone.now()

    # 2. Comprehensive bills dataset
    bills_specs = [
        {
            'name': 'High-Speed Fibre Broadband',
            'category': BillCategory.INTERNET,
            'description': '1Gbps symmetrical commercial fiber internet link',
            'amount': Decimal('25.0000000'),
            'currency': AssetType.USDC,
            'recipient_name': 'Stellar Telecom Inc',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'TELCO-88219-FIBER',
            'frequency': BillFrequency.MONTHLY,
            'due_date': today - timedelta(days=2),  # OVERDUE
            'start_date': today - timedelta(days=62),
        },
        {
            'name': 'City Grid Electricity',
            'category': BillCategory.ELECTRICITY,
            'description': 'Smart meter residential electrical consumption billing',
            'amount': Decimal('38.5000000'),
            'currency': AssetType.USDC,
            'recipient_name': 'Metro Power Distribution',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'PWR-MTR-90412',
            'frequency': BillFrequency.MONTHLY,
            'due_date': today + timedelta(days=2),  # DUE SOON
            'start_date': today - timedelta(days=58),
        },
        {
            'name': 'Downtown Apartment Rent',
            'category': BillCategory.RENT,
            'description': 'Monthly residential lease agreement - Unit 402',
            'amount': Decimal('450.0000000'),
            'currency': AssetType.USDC,
            'recipient_name': 'Skyline Real Estate Corp',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'RENT-APT-402',
            'frequency': BillFrequency.MONTHLY,
            'due_date': today + timedelta(days=12),  # UPCOMING
            'start_date': today - timedelta(days=48),
        },
        {
            'name': 'Adobe Creative Cloud & Figma',
            'category': BillCategory.SUBSCRIPTIONS,
            'description': 'Design, vector prototyping, and collaboration suite monthly license',
            'amount': Decimal('18.0000000'),
            'currency': AssetType.USDC,
            'recipient_name': 'Design Suite Billing',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'SUB-CC-2026',
            'frequency': BillFrequency.MONTHLY,
            'due_date': today + timedelta(days=1),  # DUE SOON
            'start_date': today - timedelta(days=59),
        },
        {
            'name': 'Municipal Clean Water & Sewage',
            'category': BillCategory.WATER,
            'description': 'Clean water supply, meter reading, and city drainage maintenance',
            'amount': Decimal('45.0000000'),
            'currency': AssetType.EUR,
            'recipient_name': 'CleanWater Utilities Board',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'WTR-RES-10492',
            'frequency': BillFrequency.MONTHLY,
            'due_date': today + timedelta(days=18),  # UPCOMING
            'start_date': today - timedelta(days=72),
        },
        {
            'name': 'Global Health & Dental Plan',
            'category': BillCategory.INSURANCE,
            'description': 'Comprehensive medical, emergency clinic, and optical/dental coverage',
            'amount': Decimal('140.0000000'),
            'currency': AssetType.XLM,
            'recipient_name': 'Stellar Shield Underwriters',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'HLTH-POL-7731',
            'frequency': BillFrequency.MONTHLY,
            'due_date': today + timedelta(days=22),  # UPCOMING
            'start_date': today - timedelta(days=45),
        },
        {
            'name': 'Dedicated Cloud Server & RPC Node',
            'category': BillCategory.BUSINESS_UTILITIES,
            'description': 'Soroban validator infrastructure hosting & RPC proxy cluster',
            'amount': Decimal('30.0000000'),
            'currency': AssetType.USDC,
            'recipient_name': 'Apex Cloud Infrastructure',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'SRV-VAL-091',
            'frequency': BillFrequency.QUARTERLY,
            'due_date': today + timedelta(days=35),  # UPCOMING
            'start_date': today - timedelta(days=90),
        },
        {
            'name': 'Full-Stack Web3 Bootcamp Tuition',
            'category': BillCategory.EDUCATION,
            'description': 'Stellar Soroban smart contracts & Rust protocol masterclass',
            'amount': Decimal('300.0000000'),
            'currency': AssetType.USDC,
            'recipient_name': 'Stellar Academy Tech Institute',
            'recipient_stellar_address': 'GA4KDGQIIXA7SQZB43AIK254XTSGYV3HBX4GAPKU3N2ECP76IX4U557Q',
            'account_reference': 'ACAD-STU-3320',
            'frequency': BillFrequency.QUARTERLY,
            'due_date': today + timedelta(days=55),  # UPCOMING
            'start_date': today - timedelta(days=95),
        },
    ]

    created_bills = []
    for spec in bills_specs:
        bill, _ = Bill.objects.update_or_create(
            user=user,
            name=spec['name'],
            defaults={
                'category': spec['category'],
                'description': spec['description'],
                'amount': spec['amount'],
                'currency': spec['currency'],
                'recipient_name': spec['recipient_name'],
                'recipient_stellar_address': spec['recipient_stellar_address'],
                'account_reference': spec['account_reference'],
                'frequency': spec['frequency'],
                'start_date': spec['start_date'],
                'due_date': spec['due_date'],
                'is_active': True,
                'remind_7_days': True,
                'remind_3_days': True,
                'remind_1_day': True,
                'remind_on_due': True,
                'remind_overdue': True,
                'remind_in_app': True,
                'remind_email': True,
            }
        )
        created_bills.append(bill)

        # 3. Create or update active Occurrence #1
        occ, _ = BillOccurrence.objects.get_or_create(
            bill=bill,
            occurrence_number=1,
            defaults={
                'due_date': bill.due_date,
                'amount': bill.amount,
                'currency': bill.currency,
                'status': OccurrenceStatus.UPCOMING,
            }
        )
        occ.due_date = bill.due_date
        occ.amount = bill.amount
        occ.currency = bill.currency
        occ.update_dynamic_status()
        occ.save()

    # 4. Create Historical Paid Occurrences and Confirmed Payment Records
    history_specs = [
        {
            'bill_name': 'City Grid Electricity',
            'days_ago': 26,
            'occ_num': 101,
            'tx_hash': '3a8f9c2d1e0b4a7856341290abcdef1234567890abcdef1234567890abcdef12',
            'ledger': 1245890,
            'amount': Decimal('38.5000000'),
            'currency': AssetType.USDC,
        },
        {
            'bill_name': 'High-Speed Fibre Broadband',
            'days_ago': 30,
            'occ_num': 102,
            'tx_hash': '7f1e2d3c4b5a69780123456789abcdef0123456789abcdef0123456789abcdef',
            'ledger': 1241203,
            'amount': Decimal('25.0000000'),
            'currency': AssetType.USDC,
        },
        {
            'bill_name': 'Downtown Apartment Rent',
            'days_ago': 20,
            'occ_num': 103,
            'tx_hash': '99a8b7c6d5e4f3a2b1029384756abcdef987654321fedcba0987654321fedcba',
            'ledger': 1248011,
            'amount': Decimal('450.0000000'),
            'currency': AssetType.USDC,
        },
        {
            'bill_name': 'Global Health & Dental Plan',
            'days_ago': 15,
            'occ_num': 104,
            'tx_hash': '55c4d3e2f1a0b9876543210fedcba9876543210fedcba9876543210fedcba987',
            'ledger': 1251340,
            'amount': Decimal('140.0000000'),
            'currency': AssetType.XLM,
        },
        {
            'bill_name': 'Municipal Clean Water & Sewage',
            'days_ago': 35,
            'occ_num': 105,
            'tx_hash': 'cc223344556677889900aabbccddeeff00112233445566778899aabbccddeeff',
            'ledger': 1239870,
            'amount': Decimal('45.0000000'),
            'currency': AssetType.EUR,
        },
        {
            'bill_name': 'Adobe Creative Cloud & Figma',
            'days_ago': 29,
            'occ_num': 106,
            'tx_hash': 'aa11bb22cc33dd44ee55ff6677889900112233445566778899aabbccddeeff00',
            'ledger': 1242190,
            'amount': Decimal('18.0000000'),
            'currency': AssetType.USDC,
        },
        {
            'bill_name': 'Dedicated Cloud Server & RPC Node',
            'days_ago': 60,
            'occ_num': 107,
            'tx_hash': '44556677889900aabbccddeeff0011223344556677889900aabbccddeeff0011',
            'ledger': 1221450,
            'amount': Decimal('30.0000000'),
            'currency': AssetType.USDC,
        },
        {
            'bill_name': 'Full-Stack Web3 Bootcamp Tuition',
            'days_ago': 45,
            'occ_num': 108,
            'tx_hash': '8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
            'ledger': 1230100,
            'amount': Decimal('300.0000000'),
            'currency': AssetType.USDC,
        },
    ]

    for h in history_specs:
        parent_bill = Bill.objects.filter(user=user, name=h['bill_name']).first()
        if not parent_bill:
            continue

        paid_date = today - timedelta(days=h['days_ago'])
        paid_dt = now - timedelta(days=h['days_ago'])

        past_occ, _ = BillOccurrence.objects.get_or_create(
            bill=parent_bill,
            occurrence_number=h['occ_num'],
            defaults={
                'due_date': paid_date,
                'amount': h['amount'],
                'currency': h['currency'],
                'status': OccurrenceStatus.PAID,
                'is_manual_paid': False,
                'paid_at': paid_dt,
                'transaction_hash': h['tx_hash'],
            }
        )
        past_occ.status = OccurrenceStatus.PAID
        past_occ.paid_at = paid_dt
        past_occ.transaction_hash = h['tx_hash']
        past_occ.save()

        PaymentRecord.objects.update_or_create(
            occurrence=past_occ,
            defaults={
                'user': user,
                'bill': parent_bill,
                'amount': h['amount'],
                'asset': h['currency'],
                'payment_method': PaymentMethod.STELLAR_TESTNET,
                'recipient_address': parent_bill.recipient_stellar_address,
                'payer_address': getattr(user.profile, 'wallet_address', target_wallet),
                'transaction_hash': h['tx_hash'],
                'payment_reference': past_occ.payment_reference,
                'verification_status': VerificationStatus.CONFIRMED,
                'ledger_sequence': h['ledger'],
                'ledger_timestamp': paid_dt,
            }
        )

    # 5. Process real reminders for this user
    process_scheduled_reminders(user=user)

    # Also add 2 explicit reminders for extra clarity
    fibre_bill = Bill.objects.filter(user=user, name='High-Speed Fibre Broadband').first()
    if fibre_bill:
        fibre_occ = fibre_bill.occurrences.filter(occurrence_number=1).first()
        if fibre_occ:
            Reminder.objects.get_or_create(
                user=user,
                bill=fibre_bill,
                occurrence=fibre_occ,
                reminder_type=ReminderType.OVERDUE,
                channel=ReminderChannel.IN_APP,
                defaults={
                    'scheduled_for': today,
                    'status': ReminderStatus.SENT,
                    'title': f"Overdue Bill Alert: {fibre_bill.name}",
                    'message': f"Your {fibre_bill.name} bill of {fibre_bill.amount} {fibre_bill.currency} is overdue since {fibre_occ.due_date}. Please pay promptly.",
                    'sent_at': now,
                }
            )

    electricity_bill = Bill.objects.filter(user=user, name='City Grid Electricity').first()
    if electricity_bill:
        elec_occ = electricity_bill.occurrences.filter(occurrence_number=1).first()
        if elec_occ:
            Reminder.objects.get_or_create(
                user=user,
                bill=electricity_bill,
                occurrence=elec_occ,
                reminder_type=ReminderType.UPCOMING_3D,
                channel=ReminderChannel.IN_APP,
                defaults={
                    'scheduled_for': today,
                    'status': ReminderStatus.SENT,
                    'title': f"Due Soon Alert: {electricity_bill.name}",
                    'message': f"Your {electricity_bill.name} bill of {electricity_bill.amount} {electricity_bill.currency} is due in 2 days ({elec_occ.due_date}).",
                    'sent_at': now,
                }
            )

    return {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'bills_count': Bill.objects.filter(user=user).count(),
        'occurrences_count': BillOccurrence.objects.filter(bill__user=user).count(),
        'payments_count': PaymentRecord.objects.filter(user=user).count(),
        'reminders_count': Reminder.objects.filter(user=user).count(),
    }
