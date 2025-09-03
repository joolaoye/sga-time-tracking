from django.core.management.base import BaseCommand, CommandError
from core.models import AllowedIP


class Command(BaseCommand):
    help = 'Remove an IP address from the allowed list for clock app access'

    def add_arguments(self, parser):
        parser.add_argument('ip_address', type=str, help='IP address to remove')
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force removal without confirmation'
        )

    def handle(self, *args, **options):
        ip_address = options['ip_address']
        force = options['force']

        try:
            allowed_ip = AllowedIP.objects.get(ip_address=ip_address)
        except AllowedIP.DoesNotExist:
            raise CommandError(f'IP address {ip_address} is not in the allowed list')

        if not force:
            confirm = input(f'Are you sure you want to remove IP address {ip_address}? (y/N): ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Operation cancelled'))
                return

        label = allowed_ip.label or 'No label'
        allowed_ip.delete()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully removed IP address {ip_address} ({label}) from allowed list'
            )
        ) 