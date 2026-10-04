"""Fixed list of occasions (approved by the user 2026-10-03). The writer picks at most two ids;
code turns them into Hijri windows / weekdays. needs_sharii_check marks windows to confirm with a sharia reviewer."""
OCCASIONS = {
    "none": {"ar": "لا شيء منها (دائمة)", "when": {"type": "always"}},
    "ramadan": {"ar": "رمضان", "windows": [((9, 1), (9, 30))]},
    "ramadan_last_ten": {"ar": "العشر الأواخر من رمضان", "windows": [((9, 21), (9, 30))]},
    "zakat_al_fitr": {"ar": "زكاة الفطر", "windows": [((9, 25), (10, 1))]},
    "eid_al_fitr": {"ar": "عيد الفطر", "windows": [((10, 1), (10, 3))]},
    "shawwal": {"ar": "شوال بعد العيد", "windows": [((10, 2), (10, 30))]},
    "hajj_season": {"ar": "موسم الحج", "windows": [((11, 15), (12, 13))]},
    "dhul_hijjah_ten": {"ar": "عشر ذي الحجة", "windows": [((12, 1), (12, 10))]},
    "arafah": {"ar": "يوم عرفة", "windows": [((12, 9), (12, 9))]},
    "eid_al_adha": {"ar": "عيد الأضحى وأيام التشريق", "windows": [((12, 10), (12, 13))]},
    "after_hajj": {"ar": "عودة الحجاج", "windows": [((12, 14), (12, 30))]},
    "hijri_new_year": {"ar": "بداية السنة الهجرية", "windows": [((1, 1), (1, 1))]},
    "ashura": {"ar": "عاشوراء", "windows": [((1, 9), (1, 10))]},
    "white_days": {"ar": "الأيام البيض", "needs_sharii_check": "12/13 excluded (a day of tashreeq); confirm with a sharia reviewer",
                   "windows": [((m, 13), (m, 15)) for m in range(1, 13) if m not in (9, 12)] + [((12, 14), (12, 15))]},
    "monday_thursday": {"ar": "الاثنين والخميس", "when": {"type": "weekday", "weekdays": [1, 4]}},
    "friday": {"ar": "الجمعة", "when": {"type": "weekday", "weekdays": [5]}},
}
MAX_OCCASIONS = 2


def to_when(ids):
    """Union of up to two occasions. Mixing weekly and Hijri occasions is rejected (no such case in the list)."""
    ids = [i for i in ids if i != "none"][:MAX_OCCASIONS]
    if not ids:
        return {"type": "always"}
    whens = [OCCASIONS[i].get("when") for i in ids]
    if all(w and w["type"] == "weekday" for w in whens):
        return {"type": "weekday", "weekdays": sorted({d for w in whens for d in w["weekdays"]})}
    if any(w for w in whens):
        raise ValueError(f"cannot combine weekly and Hijri occasions: {ids}")
    return {"type": "hijri", "windows": [{"from": {"month": a[0], "day": a[1]}, "to": {"month": b[0], "day": b[1]}} for i in ids for a, b in OCCASIONS[i]["windows"]]}
