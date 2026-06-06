"""
Email service for deal alerts.

Uses Python's built-in smtplib (no external dependency).
Falls back to console logging when SMTP is not configured.
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)


def _build_deal_html(deal: dict, public_url: str) -> str:
    trip_desc = deal.get("trip_description", "Your watched trip")
    trigger   = deal.get("trigger_reason", "A deal trigger was hit")
    details   = deal.get("details", {})
    profile_id = deal.get("profile_id", "")

    rows = "".join(
        f"<tr><td style='padding:6px 12px;color:#94a3b8'>{k}</td>"
        f"<td style='padding:6px 12px;color:#e2e8f0;font-weight:600'>{v}</td></tr>"
        for k, v in details.items()
    )

    book_link = f"{public_url}/?p={profile_id}" if profile_id else public_url

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#1a1d27;border-radius:12px;overflow:hidden">
    <div style="background:#7c3aed;padding:24px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px">✈️ Deal Alert — Act Fast!</h1>
      <p style="margin:8px 0 0;color:#ddd6fe;font-size:14px">{trip_desc}</p>
    </div>
    <div style="padding:28px 32px">
      <div style="background:#312e81;border-radius:8px;padding:16px 20px;margin-bottom:20px">
        <p style="margin:0;color:#c4b5fd;font-size:13px;text-transform:uppercase;letter-spacing:.06em">Trigger</p>
        <p style="margin:6px 0 0;color:#fff;font-size:16px;font-weight:600">{trigger}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        {rows}
      </table>
      <a href="{book_link}"
         style="display:block;text-align:center;background:#16a34a;color:#fff;text-decoration:none;
                padding:14px 24px;border-radius:8px;font-size:16px;font-weight:700">
        Open My Travel Agent →
      </a>
      <p style="margin:16px 0 0;color:#4b5563;font-size:12px;text-align:center">
        This alert was sent by your personal AI Travel Agent.<br>
        Deals move fast — prices and availability can change within hours.
      </p>
    </div>
  </div>
</body>
</html>
"""


def send_deal_alert(to_email: str, deal: dict) -> bool:
    """
    Send a deal alert email.

    Args:
        to_email: recipient address
        deal: dict with keys: trip_description, trigger_reason, details (dict), profile_id

    Returns:
        True if sent (or simulated), False on error.
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    public_url = os.getenv("PUBLIC_URL", "http://localhost:8000")

    subject = f"✈️ Deal Alert: {deal.get('trip_description', 'Your watched trip')}"
    html_body = _build_deal_html(deal, public_url)
    text_body = (
        f"Deal Alert: {deal.get('trip_description', '')}\n\n"
        f"Trigger: {deal.get('trigger_reason', '')}\n\n"
        + "\n".join(f"{k}: {v}" for k, v in deal.get("details", {}).items())
        + f"\n\nBook now: {public_url}/?p={deal.get('profile_id', '')}"
    )

    if not smtp_host or not smtp_user:
        logger.info("── SIMULATED EMAIL (SMTP not configured) ──")
        logger.info("To:      %s", to_email)
        logger.info("Subject: %s", subject)
        logger.info(text_body)
        logger.info("────────────────────────────────────────────")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = smtp_user
        msg["To"]      = to_email
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())

        logger.info("Deal alert sent to %s", to_email)
        return True

    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False
