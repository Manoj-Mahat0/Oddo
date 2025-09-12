# print_settings.py
from app.config import settings
print("ALLOWED_SSID:", repr(settings.ALLOWED_SSID))
print("ALLOWED_SSID_ALT:", repr(settings.ALLOWED_SSID_ALT))
print("OFFICE_LAT:", settings.OFFICE_LAT, "OFFICE_LNG:", settings.OFFICE_LNG)
print("ALLOWED_RADIUS_METERS:", settings.ALLOWED_RADIUS_METERS)
print("ATTEMPT_LIMIT:", settings.ATTEMPT_LIMIT)
