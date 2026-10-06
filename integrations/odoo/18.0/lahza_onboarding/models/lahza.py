"""Links into Lahza and the fixed texts of its reminders. Nothing here is written by a model."""

DEFAULT_URL = "https://lahza-flame.vercel.app"

JOURNEYS = [
    ("ramadan", "Ramadan"),
    ("eid", "Eid"),
    ("friday", "Friday"),
    ("prayer", "Prayer times"),
    ("team-dinner", "Team dinner"),
    ("inshallah", "Inshallah"),
]

NAMES = {
    "ramadan": {"en": "Ramadan", "ar": "رمضان", "ur": "رمضان"},
    "eid": {"en": "Eid", "ar": "العيد", "ur": "عید"},
    "friday": {"en": "Friday", "ar": "الجمعة", "ur": "جمعہ"},
    "prayer": {"en": "Prayer times", "ar": "أوقات الصلاة", "ur": "نماز کے اوقات"},
    "team-dinner": {"en": "Team dinner", "ar": "عشاء الفريق", "ur": "ٹیم ڈنر"},
    "inshallah": {"en": "Inshallah", "ar": "إن شاء الله", "ur": "ان شاء اللہ"},
}

REMINDER = {
    "en": {
        "summary": "Lahza: {name} is coming, 3 minutes",
        "note": "{name} begins on {date}. A 3-minute Lahza journey explains what you will see around you at work.",
        "link": "Open the journey",
    },
    "ar": {
        "summary": "لحظة: {name} قرّب، 3 دقائق",
        "note": "يبدأ {name} في {date}. رحلة قصيرة في لحظة (3 دقائق) تشرح لك ما ستراه حولك في الدوام.",
        "link": "افتح الرحلة",
    },
    "ur": {
        "summary": "لحظہ: {name} قریب ہے، 3 منٹ",
        "note": "{name} کی تاریخ: {date}۔ لحظہ کا 3 منٹ کا سفر بتاتا ہے کہ دفتر میں آپ کیا دیکھیں گے۔",
        "link": "سفر کھولیں",
    },
}


def lahza_lang(odoo_lang):
    """Lahza speaks en, ar and ur; every other Odoo language gets English."""
    code = (odoo_lang or "en")[:2]
    return code if code in ("ar", "ur") else "en"


def param(env, key):
    """Odoo 20 renamed get_param to get_str; earlier versions only have get_param."""
    params = env["ir.config_parameter"].sudo()
    return (params.get_str if hasattr(params, "get_str") else params.get_param)(key) or ""


def settings(env):
    base = (param(env, "lahza_onboarding.url") or DEFAULT_URL).rstrip("/")
    code = param(env, "lahza_onboarding.company_code").strip().lower()
    return base, code


def welcome_url(env, lang):
    base, code = settings(env)
    return f"{base}/{lang}?c={code}" if code else f"{base}/{lang}"


def journey_url(env, lang, journey):
    base, code = settings(env)
    return f"{base}/{lang}/j/{journey}?c={code}" if code else f"{base}/{lang}/j/{journey}"
