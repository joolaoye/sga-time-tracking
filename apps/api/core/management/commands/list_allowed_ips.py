from django.core.management.base import BaseCommand
from core.models import AllowedIP


class Command(BaseCommand):
    help = 'List all IP addresses allowed to access the clock app'

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            choices=['table', 'json', 'csv'],
            default='table',
            help='Output format (default: table)'
        )

    def handle(self, *args, **options):
        allowed_ips = AllowedIP.objects.all().order_by('ip_address')
        format_type = options['format']

        if not allowed_ips.exists():
            self.stdout.write(self.style.WARNING('No IP addresses in the allowed list'))
            return

        if format_type == 'json':
            self._output_json(allowed_ips)
        elif format_type == 'csv':
            self._output_csv(allowed_ips)
        else:
            self._output_table(allowed_ips)

    def _output_table(self, allowed_ips):
        """Output as a formatted table"""
        self.stdout.write('\nAllowed IP Addresses:')
        self.stdout.write('-' * 80)
        self.stdout.write(f'{"ID":<5} {"IP Address":<20} {"Label":<30} {"Created By":<20} {"Created At"}')
        self.stdout.write('-' * 80)
        
        for ip in allowed_ips:
            created_by = ip.created_by.full_name if ip.created_by else 'N/A'
            label = ip.label or 'No label'
            self.stdout.write(
                f'{ip.id:<5} {ip.ip_address:<20} {label:<30} {created_by:<20} {ip.created_at.strftime("%Y-%m-%d %H:%M")}'
            )
        
        self.stdout.write('-' * 80)
        self.stdout.write(f'Total: {allowed_ips.count()} IP addresses')

    def _output_json(self, allowed_ips):
        """Output as JSON"""
        import json
        data = []
        for ip in allowed_ips:
            data.append({
                'id': ip.id,
                'ip_address': ip.ip_address,
                'label': ip.label,
                'created_by': ip.created_by.full_name if ip.created_by else None,
                'created_at': ip.created_at.isoformat()
            })
        self.stdout.write(json.dumps(data, indent=2))

    def _output_csv(self, allowed_ips):
        """Output as CSV"""
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['ID', 'IP Address', 'Label', 'Created By', 'Created At'])
        
        # Write data
        for ip in allowed_ips:
            created_by = ip.created_by.full_name if ip.created_by else ''
            label = ip.label or ''
            writer.writerow([
                ip.id,
                ip.ip_address,
                label,
                created_by,
                ip.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
        
        self.stdout.write(output.getvalue())
        output.close() 