from __future__ import annotations

import os

from django.core.wsgi import get_wsgi_application

from moviqo.building_blocks.tenancy.checks import validate_tenant_startup_configuration

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "moviqo.settings.production")

application = get_wsgi_application()

validate_tenant_startup_configuration()
