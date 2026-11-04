"""Check event data, local references, and fragment targets without dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from datetime import date
import json

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.refs, self.h1s = set(), [], 0
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f"Duplicate ID: {attrs['id']}"
            self.ids.add(attrs['id'])
        self.h1s += tag == 'h1'
        for key in ('href', 'src'):
            if key in attrs: self.refs.append(attrs[key])
        if tag == 'img': assert 'alt' in attrs, 'Image missing alt text'

pages = {p.name: Page(p) for p in ROOT.glob('*.html') if not p.name.startswith('.')}
for name, page in pages.items():
    assert page.h1s == 1, f'{name}: expected one primary heading'
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc: continue
        target = unquote(url.path) or name
        assert (ROOT / target).is_file(), f'{name}: missing {target}'
        if url.fragment and target in pages:
            assert url.fragment in pages[target].ids, f'{name}: missing anchor {ref}'
events = json.loads((ROOT/'data/events.json').read_text())
ids = set()
for event in events:
    for field in ('id','title','date','category','label','description','location','url','action'):
        assert isinstance(event[field],str) and event[field].strip(), f'Missing {field}'
    assert event['id'] not in ids, 'Duplicate event ID'
    ids.add(event['id'])
    date.fromisoformat(event['date'])
    assert event['category'] in ('social','tournament','community'), 'Unknown category'
    assert event['allDay'] is True, 'Only all-day calendar entries are supported'
    link = urlsplit(event['url'])
    assert link.scheme in ('','https','mailto'), 'Unsupported event link'
    if not link.scheme: assert (ROOT/link.path).is_file(), 'Missing event page'
assert date(2026,11,18).strftime('%A') == 'Wednesday'
assert date(2026,11,20).strftime('%A') == 'Friday'
print(f'PASS: {len(pages)} pages, local links/anchors, image descriptions, and {len(events)} event records.')
