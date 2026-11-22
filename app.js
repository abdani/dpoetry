"use strict";
let activePoem=0,activePage=0;
const $=id=>document.getElementById(id);
function renderList(){
 const list=$("poemList");
 if(list.children.length!==poems.length){list.replaceChildren();
 poems.forEach((poem,index)=>{
  const button=document.createElement("button");button.type="button";button.className="poem-link";
  button.setAttribute("aria-label",`${poem.title}, ${poem.date}`);button.title=poem.title;
  button.innerHTML='<span class="node" aria-hidden="true"></span><span class="poem-text"><span class="poem-title"></span><span class="poem-date"></span></span>';
  button.querySelector(".poem-title").textContent=poem.title;
  button.querySelector(".poem-date").textContent=poem.date;
  button.addEventListener("click",()=>{selectPoem(index);if(phone.matches)setNav(false)});
  list.append(button);
 });}
 // Built once; later renders only move aria-current, so focus and scroll position survive
 [...list.children].forEach((button,index)=>button.setAttribute("aria-current",String(index===activePoem)));
 // keep the active poem visible in the rail (e.g. after First/Last), scrolling only the list
 const a=list.children[activePoem].getBoundingClientRect(),l=list.getBoundingClientRect();
 if(a.top<l.top||a.bottom>l.bottom)list.scrollTop+=a.top-l.top-(l.height-a.height)/2;
}
function renderPoem(animate=false,dir=""){
 const poem=poems[activePoem];
 $("poemKicker").textContent=`POEM No. ${String(activePoem+1).padStart(2,"0")} · ${poem.date.toUpperCase()}`;
 // bilingual poems carry titles:[English (page 1), Indonesia (page 2)]; the heading follows the page language
 const heading=$("poemHeading"),title=poem.titles?poem.titles[activePage]:poem.title;
 heading.textContent=title;
 heading.classList.toggle("long",title.length>24);
 heading.classList.toggle("starry",poem.title==="Star Vessel"); // rocket + sparkle icons around this title only
 heading.dataset.dir=poem.titles?dir:"";
 if(heading.dataset.dir){heading.style.animation="none";void heading.offsetWidth;heading.style.animation=""}
 $("firstPoem").disabled=activePoem===0;
 $("lastPoem").disabled=activePoem===poems.length-1;
 $("poemSubtitle").textContent=poem.subtitle;
 $("poemBody").replaceChildren(...poem.pages.map((text,i)=>{const page=document.createElement("div");page.className="poem-page";page.textContent=text;page.hidden=i!==activePage;return page}));
 $("readerCount").textContent=`${String(activePoem+1).padStart(2,"0")} — ${String(poems.length).padStart(2,"0")}`;
 $("poemBody").dataset.dir=dir; // "next" | "prev" → directional page-turn animation
 $("prevPage").disabled=activePage===0;
 $("nextPage").disabled=activePage===1;
 const dots=$("pageDots");dots.replaceChildren();
 poem.pages.forEach((_,i)=>{const dot=document.createElement("button");dot.className="page-dot";dot.type="button";dot.setAttribute("aria-label",`Buka halaman ${i+1}`);dot.setAttribute("aria-current",String(i===activePage));dot.addEventListener("click",()=>goToPage(i));dots.append(dot)});
 renderList();
 if(animate){const card=$("poemCard");card.classList.remove("enter");void card.offsetWidth;card.classList.add("enter")}
}
function selectPoem(index){if(index===activePoem)return;activePoem=index;activePage=0;renderPoem(true)}
// if the reader has scrolled past the top of the poem, glide back to it (only then — a visible card stays put)
function revealPoem(){
 const top=$("poemCard").getBoundingClientRect().top;
 if(top<0)window.scrollTo({top:scrollY+top-16,behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"auto":"smooth"});
}
function goToPage(page){if(page<0||page>1||page===activePage)return;const dir=page>activePage?"next":"prev";activePage=page;renderPoem(false,dir);revealPoem()}
$("firstPoem").addEventListener("click",()=>{selectPoem(0);revealPoem()});
$("lastPoem").addEventListener("click",()=>{selectPoem(poems.length-1);revealPoem()});
$("prevPage").addEventListener("click",()=>goToPage(0));
$("nextPage").addEventListener("click",()=>goToPage(1));
$("backLink").addEventListener("click",()=>{activePage=0;renderPoem(true);window.scrollTo({top:0,behavior:"smooth"})});
const app=document.querySelector(".app"),phone=matchMedia("(max-width:650px)");
function setNav(open){
 const reader=document.querySelector(".reader"),x0=reader.getBoundingClientRect().left;
 app.classList.toggle("nav-collapsed",!open);
 $("navToggle").setAttribute("aria-expanded",String(open));
 $("navToggle").setAttribute("aria-label",open?"Ciutkan navigasi":"Buka navigasi");
 // desktop: the reader moves with the rail — FLIP it (start where it was, glide to the new spot) on the GPU instead of animating layout
 const dx=x0-reader.getBoundingClientRect().left;
 if(dx&&!matchMedia("(prefers-reduced-motion:reduce)").matches)reader.animate([{transform:`translateX(${dx}px)`},{transform:"none"}],{duration:550,easing:"cubic-bezier(.2,.7,.2,1)"});
}
$("navToggle").addEventListener("click",()=>setNav(app.classList.contains("nav-collapsed")));
// On phones the expanded navbar overlays the poem: tap outside or Esc closes it
document.addEventListener("click",event=>{if(phone.matches&&!app.classList.contains("nav-collapsed")&&!$("timeline").contains(event.target))setNav(false)});
phone.addEventListener("change",event=>setNav(!event.matches));
setNav(!phone.matches);
document.addEventListener("keydown",event=>{
 if(event.altKey||event.ctrlKey||event.metaKey||event.target.closest("input"))return; // typing in search must not turn pages
 if(event.key==="Escape"&&phone.matches)setNav(false);
 if(event.key==="ArrowRight")goToPage(1);
 if(event.key==="ArrowLeft")goToPage(0);
});
let touchStartX=0;
$("poemCard").addEventListener("touchstart",event=>{touchStartX=event.changedTouches[0].clientX},{passive:true});
$("poemCard").addEventListener("touchend",event=>{const delta=event.changedTouches[0].clientX-touchStartX;if(Math.abs(delta)>55)goToPage(delta<0?1:0)},{passive:true});
// id → [name, bg, accent] (colors only for the menu swatches; the palettes live in CSS)
const THEMES={dark:["Midnight","#101114","#c7a8a0"],ocean:["Ocean","#12203a","#86b9e0"],lavender:["Lavender","#221a34","#c9a6ee"],wine:["Wine","#2a1419","#e7a2a6"],
 light:["Daylight","#ecebe8","#7c5a51"],rose:["Rosé","#e9d4d6","#8d3a4e"],sage:["Sage","#d3dfd0","#2f6343"],sepia:["Sepia","#e5d3b5","#80431a"]};
function setTheme(theme){
 if(!THEMES[theme])theme="dark";
 document.documentElement.dataset.theme=theme;
 $("themeText").textContent=THEMES[theme][0].toUpperCase();
 $("themeToggle").setAttribute("aria-label",`Tema: ${THEMES[theme][0]}. Pilih tema`);
 document.querySelector('meta[name="theme-color"]').content=THEMES[theme][1];
 $("themeMenu").querySelectorAll(".theme-option").forEach(o=>o.setAttribute("aria-pressed",String(o.dataset.theme===theme)));
 try{localStorage.setItem("afterglow-theme",theme)}catch(_){}
}
Object.entries(THEMES).forEach(([id,[name,bg,accent]])=>{
 const o=document.createElement("button");o.type="button";o.className="theme-option";o.dataset.theme=id;
 o.innerHTML=`<span class="swatch" style="--sw-bg:${bg};--sw-accent:${accent}"></span>${name}`;
 o.addEventListener("click",()=>{setTheme(id);$("themeMenu").hidePopover()});
 $("themeMenu").append(o);
});
let savedTheme=null;try{savedTheme=localStorage.getItem("afterglow-theme")}catch(_){}
setTheme(savedTheme||"dark");
// ===== Search: case/diacritic-insensitive (Arabic harakat too), up to 4 results with a 2-line snippet =====
// fold() lowercases + strips combining marks and keeps a map back to the original indices (for highlighting)
const fold=s=>{let n="";const map=[];for(let i=0;i<s.length;i++)for(const ch of s[i].normalize("NFD").replace(/\p{M}/gu,"").toLowerCase()){n+=ch;map.push(i)}return[n,map]};
const foldCache=new Map(),folded=s=>{if(!foldCache.has(s))foldCache.set(s,fold(s));return foldCache.get(s)};
const esc=s=>s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const flat=s=>esc(s.replace(/\s*\n+\s*/g," / "));
function findPoems(query){
 const q=fold(query.trim())[0];if(q.length<2)return null;
 const hits=[];
 poems.forEach((p,i)=>{
  // poem text first (so the snippet shows the match), then titles and subtitle
  const fields=[...p.pages.map((t,pg)=>[t,pg,"body"]),...(p.titles||[p.title]).map((t,pg)=>[t,pg,"title"]),[p.title,0,"title"],[p.subtitle,0,"subtitle"]];
  for(const[text,pg,kind]of fields){const[n,map]=folded(text),at=n.indexOf(q);
   if(at>=0){hits.push({i,pg,kind,text,start:map[at],end:map[at+q.length-1]+1});return}}
 });
 return hits;
}
const marked=h=>flat(h.text.slice(0,h.start))+"<mark>"+flat(h.text.slice(h.start,h.end))+"</mark>"+flat(h.text.slice(h.end));
function snippet(h){
 if(h.kind==="subtitle")return marked(h);                  // the match is in the subtitle: show it, highlighted
 if(h.kind==="title")return flat(poems[h.i].pages[h.pg].slice(0,180)); // title already highlighted: show the opening lines
 const t=h.text,from=Math.max(0,t.lastIndexOf(" ",Math.max(0,h.start-26))),to=Math.min(t.length,h.end+130);
 return(from>0?"… ":"")+flat(t.slice(from,h.start))+"<mark>"+flat(t.slice(h.start,h.end))+"</mark>"+flat(t.slice(h.end,to))+(to<t.length?" …":"");
}
let searchAll=false; // typing shows the top 5; Enter / search key / "Semua hasil" shows every hit (scrollable)
function renderSearch(){
 const box=$("searchResults"),query=$("searchInput").value,hits=findPoems(query);
 if(!hits){box.hidden=true;return}
 box.replaceChildren();
 const shown=searchAll?hits:hits.slice(0,5);
 shown.forEach(h=>{
  const p=poems[h.i],b=document.createElement("button");b.type="button";b.className="result";
  const title=h.kind==="title"?marked(h):esc(p.titles?p.titles[h.pg]:p.title);
  b.innerHTML=`<span class="result-title">${title}</span><span class="result-meta">No. ${String(h.i+1).padStart(2,"0")} · Hal. ${h.pg+1}${(p.subtitle.match(/^Versi \d+/)||[""]).map(v=>v&&" · "+v)}</span><span class="result-snippet">${snippet(h)}</span>`;
  b.addEventListener("click",()=>{activePoem=h.i;activePage=h.pg;renderPoem(true);box.hidden=true});
  box.append(b);
 });
 const note=document.createElement("div");note.className="search-note";
 if(!hits.length)note.textContent=`Tidak ada puisi dengan kata “${query.trim()}”.`;
 else if(shown.length<hits.length){
  note.innerHTML=`<span>${shown.length} dari ${hits.length} puisi</span><button type="button" class="search-all" title="Tekan Enter (atau tombol cari di keyboard HP) untuk semua hasil"><kbd>↵ Enter</kbd><svg class="key-search" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>Semua hasil</button>`;
  // stopPropagation: the re-render detaches this button, so the outside-click closer must not see the click
  // (the clicked button is replaced, so give focus back to the input — not on touch, where it would pop the keyboard)
  note.querySelector("button").addEventListener("click",event=>{event.stopPropagation();showAllResults();if(!matchMedia("(pointer:coarse)").matches)$("searchInput").focus({preventScroll:true})});
 }
 else note.textContent=`${hits.length} puisi`;
 box.append(note);box.hidden=false;
}
function showAllResults(){searchAll=true;renderSearch();$("searchResults").scrollTop=0}
$("searchInput").addEventListener("input",()=>{searchAll=false;renderSearch()});
$("searchInput").addEventListener("focus",renderSearch);
$("searchInput").addEventListener("keydown",event=>{
 if(event.key==="Enter"){event.preventDefault();showAllResults();if(matchMedia("(pointer:coarse)").matches)event.target.blur()} // phone: drop the keyboard so the list is visible
 if(event.key==="Escape")$("searchResults").hidden=true;
});
document.addEventListener("click",event=>{if(!event.target.closest(".search"))$("searchResults").hidden=true});

// Align the floating rail with the card (instead of the viewport centre):
// same top edge, bottom level with the card's min-height, never past the viewport.
function placeNav(){
 const wrap=document.querySelector(".nav-wrap"),nav=$("timeline"),card=$("poemCard"),
  c=card.getBoundingClientRect(),gutter=parseFloat(getComputedStyle(app).paddingLeft);
 const top=Math.round(c.top+scrollY);
 const bottom=Math.min(c.top+scrollY+parseFloat(getComputedStyle(card).minHeight),innerHeight-gutter);
 wrap.style.top=top+"px";wrap.style.transform="none";nav.style.maxHeight=Math.max(160,Math.round(bottom-top))+"px";
}

renderPoem();
placeNav();
document.documentElement.classList.remove("boot");
addEventListener("resize",placeNav);
document.fonts.ready.then(placeNav);
