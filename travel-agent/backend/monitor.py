"""
Background deal monitoring service.

Runs an APScheduler job every 60 minutes that:
1. Loads all user profiles
2. Checks each active watch for trigger conditions
3. Sends email alerts via email_service when triggered
4. Marks watches as alerted (24h cooldown per watch)

Trigger conditions:
- Round-trip cash price drops below max_price_target
- Hotel nightly rate drops below max_hotel_rate
- Simulated award space opening on preferred cabin
"""

import logging
import random
from datetime import datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler

from email_service import send_deal_alert
from memory import TravelMemory, PROFILES_DIR

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _simulate_current_price(baseline: float, watch_id: str) -> float:
    """
    Simulate a market price check with deterministic-ish variation.
    In production this would call a real flights/hotels API.
    Uses the watch_id + current hour as seed so prices shift hourly.
    """
    hour_seed = int(datetime.now().strftime("%Y%m%d%H")) + hash(watch_id) % 10000
    rng = random.Random(hour_seed)
    # 30% chance of a meaningful drop this hour (to make demos exciting)
    if rng.random() < 0.30:
        return baseline * rng.uniform(0.70, 0.88)
    return baseline * rng.uniform(0.95, 1.10)


def _check_watch(profile_id: str, watch: dict) -> bool:
    """
    Evaluate one watch against current simulated prices.
    Returns True if an alert was sent.
    """
    # Skip if already alerted within 24h
    if watch.get("alert_sent"):
        alerted_at = watch.get("alerted_at", "")
        try:
            if datetime.now() - datetime.fromisoformat(alerted_at) < timedelta(hours=24):
                return False
        except ValueError:
            pass

    alert_email = watch.get("alert_email", "")
    if not alert_email:
        return False

    triggered = False
    deal_details: dict = {}
    trigger_reason = ""

    # ── Flight price trigger ─────────────────────────────────────────────────
    if watch.get("max_price_target"):
        baseline = watch["max_price_target"] * 1.20  # assume baseline is 20% above target
        current  = _simulate_current_price(baseline, watch["id"] + "flight")
        deal_details["Route"] = f"{watch.get('origin')} → {watch.get('destination')} (round-trip)"
        deal_details["Current Price"] = f"${current:.0f}"
        deal_details["Your Target"] = f"${watch['max_price_target']:.0f}"
        deal_details["Travel Window"] = watch.get("travel_month", "")
        if current <= watch["max_price_target"]:
            triggered = True
            savings = watch["max_price_target"] - current
            trigger_reason = f"✈️ Flight price dropped to ${current:.0f} — ${savings:.0f} below your ${watch['max_price_target']:.0f} target!"

    # ── Hotel rate trigger ────────────────────────────────────────────────────
    if watch.get("max_hotel_rate") and not triggered:
        baseline = watch["max_hotel_rate"] * 1.15
        current  = _simulate_current_price(baseline, watch["id"] + "hotel")
        deal_details["Hotel"] = watch.get("hotel_id", "Watched hotel")
        deal_details["Current Rate"] = f"${current:.0f}/night"
        deal_details["Your Target"]  = f"${watch['max_hotel_rate']:.0f}/night"
        if current <= watch["max_hotel_rate"]:
            triggered = True
            trigger_reason = f"🏨 Hotel rate dropped to ${current:.0f}/night — at your target!"

    # ── Award space trigger ───────────────────────────────────────────────────
    if watch.get("award_alert") and not triggered:
        rng = random.Random(int(datetime.now().strftime("%Y%m%d%H")) + hash(watch["id"]) % 9999)
        if rng.random() < 0.15:  # 15% chance per check
            cabin = watch.get("preferred_cabin", "business")
            triggered = True
            trigger_reason = f"🎫 {cabin.title()} award space just opened on {watch.get('origin')} → {watch.get('destination')}!"
            deal_details["Route"]  = f"{watch.get('origin')} → {watch.get('destination')}"
            deal_details["Cabin"]  = cabin
            deal_details["Action"] = "Book quickly — award space is limited!"

    if triggered:
        deal = {
            "trip_description": watch.get("description", "Your watched trip"),
            "trigger_reason":   trigger_reason,
            "details":          deal_details,
            "profile_id":       profile_id,
        }
        sent = send_deal_alert(alert_email, deal)
        if sent:
            logger.info("Alert sent for watch %s to %s", watch["id"], alert_email)
        return sent

    return False


def _run_all_checks():
    """Check every active watch across all profiles."""
    PROFILES_DIR.mkdir(exist_ok=True)
    profile_files = list(PROFILES_DIR.glob("*.json"))
    logger.info("Deal monitor: checking %d profiles at %s", len(profile_files), datetime.now().strftime("%H:%M"))

    for profile_path in profile_files:
        profile_id = profile_path.stem
        mem = TravelMemory.load_profile(profile_id)
        if not mem:
            continue

        watches = mem.profile.get("active_watches", [])
        active  = [w for w in watches if w.get("status") == "active"]

        for watch in active:
            mem.update_watch_checked(watch["id"])
            alerted = _check_watch(profile_id, watch)
            if alerted:
                mem.mark_watch_alerted(watch["id"])


def start_monitor():
    global _scheduler
    if _scheduler and _scheduler.running:
        return
    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(_run_all_checks, "interval", minutes=60, id="deal_monitor",
                       next_run_time=datetime.now() + timedelta(seconds=10))
    _scheduler.start()
    logger.info("Deal monitor started — checking every 60 minutes")


def stop_monitor():
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Deal monitor stopped")


def trigger_check_now():
    """Force an immediate check (for testing / demo purposes)."""
    _run_all_checks()
    return {"status": "check_complete", "timestamp": datetime.now().isoformat()}
