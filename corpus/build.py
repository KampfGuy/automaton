import re, json, math, collections, os
RAW=os.path.join(os.path.dirname(__file__),'raw')
BOOKS={  # id: (title, author, year, cap, focus-regex or None)
 15776:("The Economic Consequences of the Peace","J. M. Keynes",1919,60,None),
 57532:("Passages from the Life of a Philosopher","Charles Babbage",1864,60,r"engine|machine|calculat|automaton|chess|mechani"),
 7962:("Over the Top","Arthur Guy Empey",1917,50,None),
 14060:("Mr. Britling Sees It Through","H. G. Wells",1916,50,r"war|German|England|motor|aeroplane|zeppelin"),
 17427:("President Wilson's Addresses","Woodrow Wilson",1918,60,None),
 24668:("In Our First Year of War","Woodrow Wilson",1918,40,None),
 353:("In Flanders Fields, and Other Poems","John McCrae",1919,25,None),
 46232:("The Boy's Book of New Inventions","Harry E. Maule",1912,50,None),
 41160:("The Romance of Modern Invention","Archibald Williams",1902,50,None),
 66702:("Wireless Telegraphy and Telephony Simply Explained","A. P. Morgan",1913,40,None),
 979:("Heroes of the Telegraph","John Munro",1883,40,None),
 26023:("The League of Nations and Its Problems","L. Oppenheim",1919,40,None),
 14823:("A Student in Arms, Second Series","Donald Hankey",1917,35,None),
 558:("The Thirty-Nine Steps","John Buchan",1915,30,None),
 560:("Mr. Standfast","John Buchan",1919,30,None),
 11571:("Mr. Punch's History of the Great War","Punch",1919,60,None),
 27478:("Encyclopaedia Britannica, 11th ed., vol. III","Encyclopaedia Britannica",1910,60,r"automat|babbage|balloon|aviation|aero|motor|calculat|engine|machine|Austria|Bacon"),
 35169:("Encyclopaedia Britannica, 11th ed., vol. IX","Encyclopaedia Britannica",1910,60,r"electric|engine|dynamo|telegraph|telephone|England|Empire|Emperor|Edison|lamp"),
 2150:("Maelzel's Chess-Player (Works of Poe, vol. IV)","Edgar Allan Poe",1836,25,None),
}
STOP=set("the a an and or of to in on at for by with from as is was were be been are it its this that these those which who whom what when where why how not no but if so than then there their they them he she his her him we our you your i me my mine one all any some such into upon also very more most other only may might can could would should shall will has have had do does did being over under about after before between through during without within said says say much many us out up down own same each few both nor too s t just".split())
def toks(s): return [w for w in re.findall(r"[a-z]{3,}",s.lower()) if w not in STOP]
chunks=[]
for bid,(title,author,year,cap,focus) in BOOKS.items():
  t=open(f"{RAW}/{bid}.txt",encoding='utf-8',errors='ignore').read()
  a=re.search(r"\*\*\* ?START OF.*?\*\*\*",t); b=re.search(r"\*\*\* ?END OF",t)
  t=t[a.end() if a else 0:b.start() if b else len(t)]
  if bid==2150: t=t[t.find("MAELZEL’S CHESS-PLAYER",t.find("MAELZEL’S CHESS-PLAYER")+10):]; t=t[:60000]
  paras=[re.sub(r"\s+"," ",p).strip() for p in re.split(r"\n\s*\n",t)]
  good=[]
  for p in paras:
    if not (300<=len(p)<=1600): continue
    if re.search(r"gutenberg|transcriber|e-?book|\[illustration|http|www\.|produced by|copyright",p,re.I): continue
    if re.search(r"\b(19[2-9]\d|20\d\d)\b",p): continue
    if sum(c.isupper() for c in p)>len(p)*0.15 or sum(c.isdigit() for c in p)>len(p)*0.05: continue
    if p.count('[')>3 or p.count('|')>0 or p.count('_')>6: continue
    p=p.replace('_','')
    if len(p)>900:
      cut=p.rfind('. ',0,900); p=p[:cut+1] if cut>400 else p[:900]+'…'
    good.append(p)
  if focus:
    f=[p for p in good if re.search(focus,p,re.I)]; rest=[p for p in good if p not in f]
    good=f+rest
    sel=good[:cap]
  else:
    step=max(1,len(good)/cap); sel=[good[int(i*step)] for i in range(min(cap,len(good)))]
  for p in sel: chunks.append({"t":p,"s":f"{title}, {author} ({year})"})
  print(bid,len(good),len(sel))
df=collections.Counter(); tfs=[]
for c in chunks:
  tf=collections.Counter(toks(c["t"])); tfs.append(tf); df.update(tf.keys())
N=len(chunks); idx={}
for i,tf in enumerate(tfs):
  for w,n in tf.items():
    if df[w]>N*0.2: continue
    idx.setdefault(w,[]).append([i,n])
src=sorted(set(c["s"] for c in chunks))
out={"src":src,"chunks":[[c["t"],src.index(c["s"])] for c in chunks],"idx":idx,"n":N}
json.dump(out,open(os.path.join(os.path.dirname(__file__),'../worker/corpus.json'),'w'),separators=(',',':'),ensure_ascii=False)
print("chunks",N,"terms",len(idx))
