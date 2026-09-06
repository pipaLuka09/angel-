import io, os

SRC = '/tmp/claude-0/-home-user-angel-/194e78c5-b7d9-567d-9e9f-5f4edaaf8b10/scratchpad/tapwork-hero/NfcLab.dc.html'
OUT = '/tmp/claude-0/-home-user-angel-/194e78c5-b7d9-567d-9e9f-5f4edaaf8b10/scratchpad/live3d/e2e/nfclab_component.js'

html = io.open(SRC, encoding='utf-8').read()
start = html.index('class Component extends DCLogic {')
end = html.index('</script>', start)
js = html[start:end].rstrip() + '\n'
assert len(js) > 150000, len(js)
assert js.count('_studioRig(renderer, scene)') == 8, js.count('_studioRig(renderer, scene)')
tmp = OUT + '.tmp'
io.open(tmp, 'w', encoding='utf-8').write(js)
os.replace(tmp, OUT)
print('extracted', len(js), 'chars')
