/**
 * Rule guard for the free question. Runs before any model call.
 * PERSONAL: the user's own marriage, divorce or case. These go straight to a human specialist.
 * RULING_PHRASING: phrasings that often open a ruling request ("is it allowed", "هل يجوز", "ما حكم"). A signal
 * passed to the model, never a refusal by itself: an employee asking what is polite around colleagues is welcome.
 */
const PERSONAL: RegExp[] = [
  /\bmy (marriage|divorce|wife|husband|fianc[eé]e?)\b/i,
  /\bmarry(ing)? (my|a|her|him)\b/i,
  /طلقت|طلاقي|زواجي|هل يقع|في حالتي/,
  /میرے کیس|میری شادی|میری طلاق|mere case|meri shaadi/i,
];

const RULING_PHRASING =
  /\b(is|are|was) (it|this|that) (allowed|permitted|permissible|halal|haram)\b|\bam i allowed\b|\bpermitted for me\b|هل يجوز|يجوز لي|هل يجب|(وش|ما|ايش|إيش) حكم|هل\s.*(حرام|حلال)|جائز|kya hukm|jaiz/i;

export function isPersonalRuling(text: string): boolean {
  return PERSONAL.some((p) => p.test(text));
}

export function hasRulingPhrasing(text: string): boolean {
  return RULING_PHRASING.test(text);
}
