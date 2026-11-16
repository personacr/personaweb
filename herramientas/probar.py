"""Prueba de seguridad: el sitio tiene que armarse aunque falten campos.

Uso:  python3 herramientas/probar.py
Copia contenido/ a una carpeta temporal, lo «daña» como podría pasar al guardar desde Pages CMS
(borra campos vacíos, borra campos al azar, deja listas vacías, pone valores en blanco) y corre el armador
sobre cada copia. Si alguna vez el armador se cae, esta prueba falla y dice con qué copia.
No toca el sitio: todo se escribe en carpetas temporales. Corré esto después de cambiar
construir.py, fotos.py, las plantillas o .pages.yml.
"""
import glob, os, random, shutil, subprocess, sys, tempfile
import yaml

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)

def vaciar(v):  # lo que hace Pages CMS: los campos vacíos desaparecen
    if isinstance(v, dict): return {k: vaciar(x) for k, x in v.items() if x not in ('', None, [], {})}
    if isinstance(v, list): return [vaciar(x) for x in v]
    return v

def azar(v, rnd, p):  # borra campos al azar, vacía listas, deja textos en blanco
    if isinstance(v, dict):
        out = {}
        for k, x in v.items():
            r = rnd.random()
            if r < p: continue
            if r < p * 1.5: out[k] = None; continue
            if r < p * 2: out[k] = '' if not isinstance(x, list) else []; continue
            out[k] = azar(x, rnd, p)
        return out
    if isinstance(v, list): return [azar(x, rnd, p) for x in v if rnd.random() > p / 2]
    return v

def copia(fn):
    d = tempfile.mkdtemp(prefix='persona-prueba-')
    cont = os.path.join(d, 'contenido'); shutil.copytree('contenido', cont)
    for path in glob.glob(os.path.join(cont, '**', '*.yml'), recursive=True):
        if path.endswith('miniaturas.yml'): continue
        data = fn(yaml.safe_load(open(path, encoding='utf-8')))
        open(path, 'w', encoding='utf-8').write(yaml.safe_dump(data, allow_unicode=True, sort_keys=False))
    return d, cont

def armar(nombre, fn):
    d, cont = copia(fn)
    env = dict(os.environ, PERSONA_CONTENIDO=cont, PERSONA_SALIDA=os.path.join(d, 'salida'))
    for script in ('fotos.py', 'construir.py'):
        if script == 'fotos.py': continue  # fotos.py borra originales: aquí solo se prueba el armador
        r = subprocess.run([sys.executable, os.path.join('herramientas', script)], env=env, capture_output=True, text=True)
        if r.returncode != 0:
            print(f'✗ {nombre}: {script} se cayó. Copia en {d}\n{r.stderr[-1500:]}'); return False
    ok = os.path.exists(os.path.join(d, 'salida', 'index.html'))
    shutil.rmtree(d, ignore_errors=True)
    if not ok: print(f'✗ {nombre}: no se generó el inicio.')
    return ok

pruebas = [('contenido tal cual', lambda v: v), ('sin campos vacíos (como guarda Pages CMS)', vaciar),
           ('todo vacío', lambda v: {} if isinstance(v, dict) else v)]
for semilla in range(1, 13):
    rnd = random.Random(semilla); p = 0.04 + 0.03 * (semilla % 5)
    pruebas.append((f'campos borrados al azar #{semilla}', lambda v, rnd=rnd, p=p: azar(v, rnd, p) or {}))
fallas = sum(not armar(n, f) for n, f in pruebas)
print(f'{len(pruebas) - fallas} de {len(pruebas)} pruebas pasaron.')
sys.exit(1 if fallas else 0)
