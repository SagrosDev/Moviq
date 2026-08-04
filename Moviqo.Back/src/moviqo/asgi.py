from __future__ import annotations

import os

from django.core.asgi import get_asgi_application

from moviqo.building_blocks.tenancy.checks import validate_tenant_startup_configuration

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "moviqo.settings.production")

application = get_asgi_application()

validate_tenant_startup_configuration()
