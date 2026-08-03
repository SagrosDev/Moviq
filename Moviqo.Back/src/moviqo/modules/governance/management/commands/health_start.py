from __future__ import annotations

from django.core.management.base import BaseCommand

from moviqo.jobs.health import run


class Command(BaseCommand):
    help = "Verify that the backend composition root can start."

    def handle(self, *args, **options):
        result = run()
        self.stdout.write(result["status"])
