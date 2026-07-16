from pathlib import Path

p = Path("secretAttraction.html")
text = p.read_text(encoding="utf-8")

old_note = """        </form>
        <p class=\"cta-note\">
          Or <a href=\"https://www.amazon.com/Secret-Attraction-Between-Mentor-Mentee/dp/B0DH2ZJ57H\" target=\"_blank\" rel=\"noopener\">get the full book on Amazon</a>
        </p>
      </div>"""
new_note = """        </form>
      </div>"""
if old_note not in text:
    raise SystemExit("cta-note block not found")
text = text.replace(old_note, new_note, 1)

old_catch = (
    "I'm giving it away because I know once you read the first few pages, "
    "you'll want the full story — either on Amazon at regular price, or as a signed copy direct from me."
)
new_catch = (
    "I'm giving it away because once you read those pages, you'll know if "
    "LaShana and Michael's story is for you — then you can decide about the full book."
)
if old_catch not in text:
    raise SystemExit("no-catch paragraph not found")
text = text.replace(old_catch, new_catch, 1)

old_span = "<span>Premium signed copy available on the next page</span>"
new_span = "<span>Instant download · No obligation</span>"
if old_span not in text:
    raise SystemExit("premium span not found")
text = text.replace(old_span, new_span, 1)

start = text.find('  <div class="section" style="padding-top:8px;">')
end = text.find("  <footer>")
if start == -1 or end == -1:
    raise SystemExit(f"block markers missing start={start} end={end}")

replacement = """  <div class=\"cta-wrap\">
    <a href=\"#optin\" class=\"cta-btn\" data-scroll-optin style=\"max-width:420px; margin:0 auto;\">
      Yes! Send My Free Chapter Now
      <span>We respect your privacy · Unsubscribe any time</span>
    </a>
  </div>

  <div class=\"ps-section\">
    <p>
      <strong>P.S.</strong> — The first chapter is free. There's genuinely nothing to lose —
      read it, love it, then grab the full book when you're ready.
    </p>
    <div class=\"cta-wrap\" style=\"padding-top:18px; padding-bottom:0;\">
      <a href=\"#optin\" class=\"cta-btn\" data-scroll-optin style=\"max-width:420px; margin:0 auto;\">
        Yes! Send My Free Chapter Now
        <span>Instant download · No credit card needed</span>
      </a>
    </div>
  </div>

"""
text = text[:start] + replacement + text[end:]
p.write_text(text, encoding="utf-8", newline="\n")
print("secretAttraction.html updated")
print("amazon-block present:", "amazon-block" in text)
print("cta-note present:", "cta-note" in text)
