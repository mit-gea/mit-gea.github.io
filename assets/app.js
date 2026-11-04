'use strict';
const menu = document.querySelector('.menu-toggle');
menu?.addEventListener('click', () => {
  const expanded = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!expanded));
  document.querySelector('#main-nav').classList.toggle('is-open', !expanded);
});
document.querySelectorAll('#main-nav a').forEach(a => a.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  document.querySelector('#main-nav').classList.remove('is-open');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.click(); menu.focus();
  }
});

if (document.querySelector('#event-list')) initCalendar();
async function initCalendar() {
  const list = document.querySelector('#event-list');
  const grid = document.querySelector('#calendar-grid');
  // Using Cambridge's date avoids shifting all-day events across time zones.
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const [year, month] = today.split('-').map(Number);
  let view = new Date(year, month - 1, 1, 12), filter = 'all', selected = null, events;
  const dateOf = date => new Date(`${date}T12:00:00`);
  const keyOf = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const format = (date, options) => dateOf(date).toLocaleDateString('en-US', options);
  const matching = () => events.filter(e => e.date.startsWith(keyOf(view).slice(0,7)) && (filter === 'all' || e.category === filter));
  const element = (tag, cls, text) => { const el = document.createElement(tag); if(cls) el.className = cls; if(text) el.textContent = text; return el; };
  try {
    const response = await fetch('data/events.json');
    if (!response.ok) throw new Error('Calendar unavailable');
    events = (await response.json()).sort((a,b) => a.date.localeCompare(b.date));
    render();
  } catch {
    list.replaceChildren(element('p', '', 'The calendar couldn’t load. Please refresh or visit the tournament hub for confirmed dates.'));
    document.querySelector('#download-calendar').disabled = true;
    document.querySelector('.calendar-panel').hidden = true;
    return;
  }
  function render() {
    document.querySelector('#calendar-month').textContent = view.toLocaleDateString('en-US', {month:'long', year:'numeric'});
    grid.replaceChildren();
    for (let i=0; i<view.getDay(); i++) grid.append(element('span'));
    const count = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();
    const monthEvents = matching();
    for (let day=1; day<=count; day++) {
      const key = keyOf(new Date(view.getFullYear(), view.getMonth(), day, 12));
      const items = monthEvents.filter(e => e.date === key);
      const cell = element('button', [items.length ? 'has-event' : '', key === today ? 'today' : ''].join(' '), String(day));
      cell.setAttribute('aria-label', `${format(key, {weekday:'long',month:'long',day:'numeric',year:'numeric'})}${key === today ? ', today' : ''}: ${items.length ? items.map(e=>e.title).join(', ') : 'No events'}`);
      cell.setAttribute('aria-pressed', String(selected === key));
      if(key === today) cell.setAttribute('aria-current','date');
      cell.addEventListener('click', () => { selected = selected === key ? null : key; render(); grid.children[view.getDay()+day-1].focus(); });
      grid.append(cell);
    }
    list.replaceChildren();
    const displayed = monthEvents.filter(e => !selected || e.date === selected);
    if (selected) {
      const reset = element('button','text-link', '← Show the whole month');
      reset.style.marginBottom = '18px';
      reset.addEventListener('click',()=>{selected=null;render();});
      list.append(reset);
    }
    if (!displayed.length) {
      const empty = element('div','empty-state');
      empty.append(element('h3','','A little room for what’s next.'),element('p','',`No ${filter === 'all' ? '' : filter+' '}events announced for ${selected ? format(selected,{month:'long',day:'numeric'}) : view.toLocaleDateString('en-US',{month:'long',year:'numeric'})}. Check back for new plans.`));
      const next = events.find(e=> e.date > (selected || keyOf(new Date(view.getFullYear(),view.getMonth()+1,0))) && (filter==='all'||filter===e.category));
      if(next){const button=element('button','text-link','Jump to the next event →');button.addEventListener('click',()=>{view=dateOf(next.date);view.setDate(1);selected=null;render();});empty.append(button);}
      list.append(empty);
    }
    displayed.forEach(event => {
      const card=element('article','event-card');
      const date=element('time','event-date'); date.dateTime=event.date;
      date.append(element('span','',format(event.date,{month:'short'})),element('strong','',format(event.date,{day:'numeric'})));
      const content=element('div');content.append(element('div','event-label',event.label),element('h3','',event.title),element('p','',event.description));
      const meta=element('div','event-meta');meta.append(element('span','',format(event.date,{weekday:'long'})),element('span','',event.location));content.append(meta);
      const action=element('a','event-action',event.action+' ↗'); action.href=event.url;content.append(action);
      const arrow=element('span','event-arrow','↗');arrow.setAttribute('aria-hidden','true');card.append(date,content,arrow);list.append(card);
    });
  }
  document.querySelector('#previous-month').addEventListener('click',()=>{view.setMonth(view.getMonth()-1);selected=null;render();});
  document.querySelector('#next-month').addEventListener('click',()=>{view.setMonth(view.getMonth()+1);selected=null;render();});
  document.querySelector('#reset-month').addEventListener('click',()=>{view=new Date(year,month-1,1,12);selected=null;render();});
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.filter;selected=null;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();
  }));
  document.querySelector('#download-calendar').addEventListener('click',()=>{
    const escape = value => value.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MIT GEA//Community Events//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:MIT GEA Events'];
    events.forEach(e=>{
      const end=dateOf(e.date);end.setDate(end.getDate()+1);
      lines.push('BEGIN:VEVENT',`UID:${e.id}@mit-gea.github.io`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${e.date.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${keyOf(end).replace(/-/g,'')}`,`SUMMARY:${escape(e.title)}`,`DESCRIPTION:${escape(e.description)}`,`LOCATION:${escape(e.location)}`,`URL:${new URL(e.url,location.href).href}`,'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    // Fold by UTF-8 byte length per RFC 5545.
    const folded=lines.map(line=>{let parts=[],part='',bytes=0;for(const ch of line){const n=new TextEncoder().encode(ch).length;if(bytes+n>75){parts.push(part);part=' ';bytes=1;}part+=ch;bytes+=n;}parts.push(part);return parts.join('\r\n');});
    const url=URL.createObjectURL(new Blob([folded.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));
    const a=element('a');a.href=url;a.download='mit-gea-events.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}
