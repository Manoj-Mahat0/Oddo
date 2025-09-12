# attendance_utils.py
from .config import settings
from typing import List, Optional
from math import radians, cos, sin, asin, sqrt
from fastapi import Request
import ipaddress

def get_allowed_ssids() -> List[str]:
    ssids: List[str] = []
    if getattr(settings, "ALLOWED_SSID", None):
        ssids.append(settings.ALLOWED_SSID.strip())
    if getattr(settings, "ALLOWED_SSID_ALT", None):
        ssids += [s.strip() for s in settings.ALLOWED_SSID_ALT.split(",") if s.strip()]
    return ssids

def extract_ssid(request: Optional[Request], payload_ssid: Optional[str], header_ssid: Optional[str] = None) -> Optional[str]:
    """
    Prefer header X-Client-SSID, then header 'ssid' if present, then payload value.
    """
    if header_ssid:
        return header_ssid
    if request:
        try:
            h = request.headers.get("X-Client-SSID") or request.headers.get("ssid") or request.headers.get("X-SSID")
            if h:
                return h
        except Exception:
            pass
    return payload_ssid

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Haversine distance between two lat/lon in meters.
    Returns large value if any param is None.
    """
    if None in (lat1, lon1, lat2, lon2):
        return float("inf")
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    R = 6371000
    return R * c

# ---------- IP helpers ----------
def get_allowed_ips() -> List[str]:
    """
    Return list of allowed IPs/CIDRs from settings (comma-separated).
    """
    raw = getattr(settings, "ALLOWED_IPS", "")
    if not raw:
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]

def get_allowed_router_ips() -> List[str]:
    """
    Return list of configured router IPs (single IPs or CIDRs) from settings.
    Example: ALLOWED_ROUTER_IPS=192.168.1.1,10.0.0.1/24
    """
    raw = getattr(settings, "ALLOWED_ROUTER_IPS", "")
    if not raw:
        return []
    return [s.strip() for s in raw.split(",") if s.strip()]

def get_client_ip(request: Optional[Request]) -> Optional[str]:
    """
    Extract client IP from request.
    Order:
      1) X-Forwarded-For header (first IP)
      2) X-Real-IP header
      3) request.client.host
    """
    if not request:
        return None
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        first = xff.split(",")[0].strip()
        if first:
            return first
    xr = request.headers.get("X-Real-IP")
    if xr:
        return xr.strip()
    try:
        if request.client and request.client.host:
            return request.client.host
    except Exception:
        pass
    return None

def is_ip_allowed(client_ip: Optional[str]) -> bool:
    """
    Check if client_ip (string) is in allowed list. Supports CIDR ranges.
    If ALLOWED_IPS is empty, returns False (strict).
    """
    if not client_ip:
        return False
    allowed = get_allowed_ips()
    if not allowed:
        return False

    # strip possible port
    if ":" in client_ip and client_ip.count(":") == 1:
        client_ip = client_ip.split(":")[0]

    for entry in allowed:
        try:
            if "/" in entry:
                net = ipaddress.ip_network(entry, strict=False)
                ip = ipaddress.ip_address(client_ip)
                if ip in net:
                    return True
            else:
                if ipaddress.ip_address(client_ip) == ipaddress.ip_address(entry):
                    return True
        except Exception:
            continue
    return False

# ---------- Router/network-based helpers ----------
def is_client_on_router_network(client_ip: Optional[str]) -> bool:
    """
    Check if client_ip belongs to any network defined by ALLOWED_ROUTER_IPS.
    For each router entry:
      - if it's a CIDR (e.g. 10.0.0.0/24) check membership directly
      - if it's a single IP (e.g. 192.168.1.1), we assume /24 network by default
        and check whether client_ip falls in that /24 (i.e., 192.168.1.0/24)
    This covers the common home/office router case.
    """
    if not client_ip:
        return False
    router_entries = get_allowed_router_ips()
    if not router_entries:
        return False

    # strip port if any
    if ":" in client_ip and client_ip.count(":") == 1:
        client_ip = client_ip.split(":")[0]

    try:
        ip_obj = ipaddress.ip_address(client_ip)
    except Exception:
        return False

    for entry in router_entries:
        try:
            if "/" in entry:
                # router entry is a network already
                net = ipaddress.ip_network(entry, strict=False)
                if ip_obj in net:
                    return True
            else:
                # treat single router IP as meaning the router's /24 subnet
                # for IPv4: derive network by replacing last octet with 0/24
                # for IPv6: fallback to direct equality or skip
                try:
                    router_ip = ipaddress.ip_address(entry)
                except Exception:
                    continue

                if router_ip.version == 4 and ip_obj.version == 4:
                    # form /24 network from router_ip
                    parts = str(router_ip).split(".")
                    if len(parts) == 4:
                        net_cidr = ".".join(parts[:3]) + ".0/24"
                        net = ipaddress.ip_network(net_cidr, strict=False)
                        if ip_obj in net:
                            return True
                else:
                    # for IPv6, if router_ip equals client or if a CIDR provided
                    if ip_obj == router_ip:
                        return True
        except Exception:
            continue
    return False
