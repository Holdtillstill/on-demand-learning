from datetime import UTC, date, datetime


def utc_now() -> datetime:
    """Return naive UTC for existing SQLAlchemy DateTime columns."""
    return datetime.now(UTC).replace(tzinfo=None)


def utc_today() -> date:
    return utc_now().date()
