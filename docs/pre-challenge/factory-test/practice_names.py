"""Words that name the practice itself, per topic. The scene must not contain any of them
(it would give the answer away). Matching is done after Arabic normalisation and light stemming.
Replaces the old check that used every word of the generated title.
"""
PRACTICE_NAMES = {
    "ramadan": ["صيام", "صائم", "صوم"], "ramadan-hours": ["صيام", "صائم", "صوم"], "iftar-invite": ["إفطار", "افطار", "صيام", "صائم"],
    "suhoor": ["سحور", "تسحر", "صيام", "صائم"], "dates-iftar": ["إفطار", "افطار", "صيام", "صائم"], "last-ten": ["اعتكاف", "قيام"],
    "laylat-alqadr": ["قيام", "إحياء الليل"], "zakat-fitr": ["زكاة الفطر", "زكاة", "فطرة"], "eid-fitr": ["تهنئة", "عيدكم مبارك", "عيد مبارك"], "eidiya": ["عيدية"],
    "shawwal-six": ["صيام", "صوم"], "ramadan-greeting": ["رمضان كريم", "رمضان مبارك"], "ramadan-quran": ["رمضان", "ختمة"],
    "hajj-leave": ["حج", "حاج"], "hajj-season": ["حج", "حجاج"], "arafah": ["صيام", "صوم"], "eid-adha": ["تهنئة", "عيدكم مبارك", "عيد مبارك"],
    "udhiyah": ["أضحية", "اضحية", "أضحى"], "dhul-hijjah-ten": ["صيام", "صوم", "تكبير"], "hajj-return": ["حج", "حاج", "حجاج"], "zamzam-gift": ["زمزم", "حج"],
    "hijri-new-year": ["السنة الهجرية", "رأس السنة"], "ashura": ["صيام", "صوم"], "white-days": ["البيض", "صيام", "صوم"], "monday-thursday": ["صيام", "صوم"],
    "friday": ["صلاة الجمعة", "خطبة", "الخطبة"], "friday-sermon": ["صلاة الجمعة", "خطبة", "الخطبة"], "friday-greeting": ["جمعة مباركة", "جمعه مباركه"],
    "prayer": ["صلاة", "صلاه", "ظهر"], "wudu": ["وضوء", "توضأ"], "prayer-room": ["مصلى", "مصلّى"], "qibla": ["قبلة"], "adhan": ["أذان", "اذان", "مؤذن"],
    "prayer-times-shift": ["أوقات الصلاة", "صلاة"], "fajr": ["فجر"], "walking-in-front": ["صلاة", "سترة"], "shops-close-prayer": ["صلاة"], "travel-prayer": ["صلاة", "قصر"],
    "team-dinner": ["حلال", "خمر", "كحول", "خنزير"], "halal": ["حلال"], "gelatin": ["جيلاتين", "حلال"], "right-hand": ["يمين", "يمنى"],
    "bismillah-eating": ["بسم الله", "تسمية"], "alhamdulillah-eating": ["الحمد لله"], "alcohol-gift": ["كحول", "خمر"],
    "inshallah": ["إن شاء الله", "ان شاء الله"], "salam": ["السلام عليكم", "سلام"], "mashallah": ["ما شاء الله"], "alhamdulillah": ["الحمد لله"],
    "jazakallah": ["جزاك الله"], "bismillah": ["بسم الله"], "astaghfirullah": ["أستغفر الله", "استغفر"], "sneeze": ["يرحمك الله", "عطس"], "wallahi": ["والله", "حلف"],
    "pbuh": ["صلى الله عليه وسلم"], "condolence": ["إنا لله", "انا لله", "راجعون", "عزاء"], "quick-burial": ["دفن", "جنازة"], "visiting-sick": ["عيادة المريض"],
    "newborn": ["مولود", "عقيقة"], "umrah-leave": ["عمرة"], "ihram-photos": ["إحرام", "احرام", "عمرة", "حج"], "sadaqah": ["صدقة"], "zakat": ["زكاة"],
    "quran-respect": ["مصحف", "قرآن"], "misbaha": ["مسبحة", "تسبيح"], "quran-recitation": ["قرآن", "تلاوة"], "names-meaning": ["عبد"], "muhammad-name": ["محمد"],
    "mosque-visit": ["مسجد"], "modest-dress": ["حشمة", "محتشم"], "hijab": ["حجاب"], "dua": ["دعاء", "يدعو"], "travel-dua": ["دعاء السفر", "دعاء"],
    "islamic-calendar-docs": ["هجري", "هجرية"],
}
