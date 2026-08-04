from __future__ import annotations

from django.core.management.base import BaseCommand

from moviqo.modules.messaging.application import drain_outbox_messages


class Command(BaseCommand):
    help = "Drain the Gate 1 email outbox using leased PostgreSQL work claims."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--batch-size", type=int, default=25)

    def handle(self, *args, **options) -> None:
        processed = drain_outbox_messages(batch_size=options["batch_size"])
        self.stdout.write(str(processed))
