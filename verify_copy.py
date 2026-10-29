from html.parser import HTMLParser
from pathlib import Path
import json

root=Path(__file__).parent
class SourceParser(HTMLParser):
    def __init__(self):
        super().__init__();self.depth=0;self.current=None;self.found={}
    def handle_starttag(self,tag,attrs):
        if tag in ['meta','link','img','input','source','br']:return
        self.depth+=1;a=dict(attrs)
        if 'data-source-index' in a:
            self.current={'index':int(a['data-source-index']),'depth':self.depth,'text':a.get('data-source-prefix','')}
    def handle_endtag(self,tag):
        if tag in ['meta','link','img','input','source','br']:return
        if self.current and self.current['depth']==self.depth:
            self.found[self.current['index']]=self.current['text'];self.current=None
        self.depth-=1
    def handle_data(self,text):
        if self.current:self.current['text']+=text
p=SourceParser();p.feed((root/'index.html').read_text())
source=json.loads((root/'source-copy.json').read_text())['paragraphs']
expected=set(range(1,20))|{21}
assert set(p.found)==expected,(set(p.found),expected)
for i in expected:
    assert p.found[i]==source[i]['text'],f'Copy mismatch {i}: {p.found[i]!r}'
print(f'PASS: {len(expected)} source text blocks match Google Docs exactly; all five full episode synopses and all three full bios included.')
