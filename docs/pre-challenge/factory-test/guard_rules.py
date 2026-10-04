"""Code rules that run before the model guard (decided by the user 2026-10-03)."""
import re

REFUSE_RULES = [
    (r"هل يجوز|هل يجب|ما حكم|\bحكم\s", "ruling request"),
    (r"شيع|السنة والشيعة|صوفي|سلفي|مذهب|طائف", "sectarian"),
    (r"حرب|غزة|فلسطين|إسرائيل|اسرائيل|سياس|انتخاب|إرهاب|داعش|حكومة", "politics_or_conflict"),
]
NEEDS_SHARII_RULES = [
    (r"عيد الميلاد|الكريسماس|كريسماس|رأس السنة الميلادية|الهالوين|عيد الحب|المولد|الإسراء والمعراج|الاسراء والمعراج", "others' holidays or occasions"),
    (r"مصافح|يصافح|تصافح|اختلاط|الجنسين|خلوة", "interaction between the sexes"),
    (r"حجاب|نقاب|تغطي وجه|تغطية الوجه|لباس|ملابس|اللبس", "dress"),
    (r"موسيق|أغان|اغان|غناء|صور|تصوير", "music and images"),
    (r"بنك|ربا|فائدة|فوائد|قرض|تمويل|استثمار|أسهم|اسهم|تأمين|معاملات مالية", "financial transactions"),
    (r"عاشوراء", "ashura"),
]


def rule_decision(topic):
    for pattern, why in REFUSE_RULES:
        if re.search(pattern, topic):
            return "refuse", why
    for pattern, why in NEEDS_SHARII_RULES:
        if re.search(pattern, topic):
            return "needs_sharii", why
    return None, None
