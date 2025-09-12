# app_streamlit.py
import sys
import subprocess
import re
from typing import Optional

import streamlit as st

st.set_page_config(page_title="Current Wi-Fi SSID", page_icon="📶")

def _run(cmd: list[str]) -> tuple[int, str, str]:
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = proc.communicate()
    return proc.returncode, out or "", err or ""

def get_ssid_windows() -> Optional[str]:
    code, out, err = _run(["netsh", "wlan", "show", "interfaces"])
    if code != 0:
        return None
    m = re.search(r"^\s*SSID\s*:\s*(.+)\r?$", out, flags=re.MULTILINE)
    if m:
        ssid = m.group(1).strip()
        return ssid or None
    return None

def get_ssid_macos() -> Optional[str]:
    code, out, err = _run(["/usr/sbin/networksetup", "-getairportnetwork", "en0"])
    if code == 0 and out:
        m = re.search(r":\s*(.+)", out)
        if m:
            return m.group(1).strip() or None
    airport_path = "/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport"
    code, out, err = _run([airport_path, "-I"])
    if code == 0 and out:
        m = re.search(r"\s*SSID:\s*(.+)", out)
        if m:
            return m.group(1).strip() or None
    return None

def get_ssid_linux() -> Optional[str]:
    code, out, err = _run(["nmcli", "-t", "-f", "active,ssid", "dev", "wifi"])
    if code == 0 and out:
        for line in out.splitlines():
            if line.startswith("yes:"):
                parts = line.split(":", 1)
                if len(parts) == 2:
                    return parts[1].strip() or None
    code, out, err = _run(["iwgetid", "-r"])
    if code == 0 and out:
        return out.strip() or None
    code, out, err = _run(["iwconfig"])
    if code == 0 and out:
        m = re.search(r'ESSID:"([^"]+)"', out)
        if m:
            return m.group(1).strip() or None
    return None

def get_connected_ssid() -> tuple[Optional[str], dict]:
    info = {"platform": sys.platform}
    try:
        platform = sys.platform
        if platform.startswith("win"):
            ssid = get_ssid_windows()
        elif platform == "darwin":
            ssid = get_ssid_macos()
        elif platform.startswith("linux"):
            ssid = get_ssid_linux()
        else:
            ssid = None
            info["error"] = "Unsupported platform"
        return ssid, info
    except Exception as e:
        info["exception"] = str(e)
        return None, info

st.title("📶 Current Wi-Fi SSID Checker")
st.write("Button dabao aur app batayega ki aap kis Wi-Fi se connected ho. (CLI commands use hoti hain — permissions/commands OS par depend karte hain.)")

col1, col2 = st.columns([3,1])
with col1:
    if st.button("Check SSID"):
        with st.spinner("SSID check kar raha hoon..."):
            ssid, meta = get_connected_ssid()
        if ssid:
            st.success(f"Aap is Wi-Fi se connected hain: **{ssid}**")
        else:
            st.error("Koi connected Wi-Fi SSID nahi mila.")
            st.markdown("**Debug info (helpful for troubleshooting):**")
            st.json(meta)
with col2:
    st.write("Info")
    st.markdown(
        """
- Windows: `netsh` use hota hai  
- macOS: `networksetup` or `airport` (en0) try hota hai  
- Linux: `nmcli`, `iwgetid`, `iwconfig` try karta hoon  
"""
    )

st.divider()
st.caption("Note: Agar commands available na ho ya permission chahiye ho to SSID nahi milega. Agar chaho main isme router BSSID (MAC) ya IP bhi add kar dunga.")
