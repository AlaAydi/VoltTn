from django.contrib import admin

# Don't register User here to avoid admin validation errors with custom fields.
# The default Django auth admin will use the default User model.
# If a custom User admin is needed, it should be configured properly with
# related field definitions that match the custom User model.