from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from moviqo.modules.organizations.models import Membership, MoviqoUser, Organization

admin.site.register(MoviqoUser, UserAdmin)
admin.site.register(Organization)
admin.site.register(Membership)
