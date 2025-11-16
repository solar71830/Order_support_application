from django.core.management.base import BaseCommand
from AuthJWT.models import User

class Command(BaseCommand):
    help = 'Tworzy super usera admin'

    def handle(self, *args, **options):
        # Sprawdź czy admin już istnieje
        if User.objects.filter(username="admin").exists():
            self.stdout.write(self.style.SUCCESS("Admin już istnieje"))
            return

        # Stwórz admina
        admin_user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123"
        )
        admin_user.role = "admin"
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("Admin został utworzony pomyślnie"))