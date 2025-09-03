from django.core.management.base import BaseCommand, CommandError
from core.models import AllowedIP, User
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = 'Add an IP address to the allowed list for clock app access'

    def add_arguments(self, parser):
        parser.add_argument('ip_address', type=str, help='IP address to allow')
        parser.add_argument('--label', type=str, help='Optional label for the IP address')
        parser.add_argument('--user', type=str, help='Access code of user adding the IP')

    def handle(self, *args, **options):
        ip_address = options['ip_address']
        label = options.get('label', '')
        user_access_code = options.get('user')

        # Validate IP address
        try:
            AllowedIP(ip_address=ip_address).clean()
        except ValidationError as e:
            raise CommandError(f'Invalid IP address: {e}')

        # Get user if provided
        created_by = None
        if user_access_code:
            try:
                created_by = User.objects.get(access_code=user_access_code)
            except User.DoesNotExist:
                raise CommandError(f'User with access code {user_access_code} not found')

        # Check if IP already exists
        if AllowedIP.objects.filter(ip_address=ip_address).exists():
            self.stdout.write(
                self.style.WARNING(f'IP address {ip_address} is already in the allowed list')
            )
            return

        # Create the allowed IP
        allowed_ip = AllowedIP.objects.create(
            ip_address=ip_address,
            label=label,
            created_by=created_by
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully added IP address {ip_address} to allowed list'
                f'{f" with label: {label}" if label else ""}'
            )
        ) 