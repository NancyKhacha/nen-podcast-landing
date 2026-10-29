"""Собирает копию лендинга для публикации на claude.ai.

Каркас страницы (doctype, head, body) публикация добавляет сама, поэтому он вырезается.
Звук с Mave на такой странице заблокирован, и кнопки «Слушать» ведут на страницы выпусков.
Запуск: python3 tools/artifact-copy.py <папка-для-копии>
Рядом с index.html копия пишет files.json — карту файлов для параметра files.
"""
import json, os, re, sys

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = sys.argv[1]
MAVE = {'01': 'https://mave.stream/e/3Dmj37HN9P', '02': 'https://mave.stream/e/XKDuNIpGcJ', '03': 'https://mave.stream/e/0v2RU36hKl',
        '04': 'https://mave.stream/e/VzgzdeZkis', '05': 'https://mave.stream/e/Je0ewkaRum'}

s = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
s = re.sub(r'<!doctype html>\s*<html lang="ru">\s*<head>\s*', '', s)
s = s.replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '').replace('</body>\n</html>', '')
s = re.sub(r'<meta charset="utf-8">\n<meta name="viewport"[^>]*>\n', '', s)
s = re.sub(r'<meta (property="og:|name="twitter:card")[^>]*>\n', '', s)
s = re.sub(r'<link rel="icon"[^>]*>\n', '', s)
s = re.sub(r'<title>.*?</title>', '<title>Нет, это ненормально</title>\n<script>document.documentElement.lang = "ru";</script>', s)


def play(m):
    n = re.search(r'data-num="Выпуск (\d\d)"', m.group(1)).group(1)
    body = m.group(2).replace('<span class="play__label">Слушать</span>', '<span class="play__label">Слушать на Mave</span>')
    return f'<a class="play" href="{MAVE[n]}" target="_blank" rel="noopener">{body}</a>'


s = re.sub(r'<button (class="play" type="button" data-play[^>]*)>(.*?)</button>', play, s, flags=re.S)
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)

css = open(os.path.join(SITE, 'styles.css'), encoding='utf-8').read()
files = {'styles.css': os.path.join(SITE, 'styles.css'), 'app.js': os.path.join(SITE, 'app.js')}
for ref in sorted(set(re.findall(r'assets/[A-Za-z0-9_./-]+\.(?:jpg|png|webp|svg)', s + css))):
    files[ref] = os.path.join(SITE, ref)
json.dump(files, open(os.path.join(OUT, 'files.json'), 'w'), ensure_ascii=False, indent=1)
print(len(files), 'files')
