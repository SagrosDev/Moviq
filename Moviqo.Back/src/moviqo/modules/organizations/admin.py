from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from moviqo.modules.organizations.models import MoviqoUser

admin.site.register(MoviqoUser, UserAdmin)
