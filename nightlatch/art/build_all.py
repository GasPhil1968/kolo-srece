"""Build every art asset: rooms, characters, UI. Usage: python3 art/build_all.py [name ...]"""
import importlib.util
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def run_module(path):
    name = os.path.splitext(os.path.basename(path))[0]
    spec = importlib.util.spec_from_file_location('room_' + name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    t = time.time()
    mod.main()
    return name, time.time() - t


def main(only=None):
    rooms = sorted(f for f in os.listdir(os.path.join(HERE, 'rooms')) if f.endswith('.py') and not f.startswith('_'))
    for f in rooms:
        if only and os.path.splitext(f)[0] not in only:
            continue
        name, dt = run_module(os.path.join(HERE, 'rooms', f))
        print(f'room {name:20s} {dt:5.2f}s')
    for extra in ('build_chars', 'build_ui', 'build_extras', 'font', 'build_manifest'):
        p = os.path.join(HERE, extra + '.py')
        if os.path.exists(p) and (not only or extra in only):
            name, dt = run_module(p)
            print(f'{name:25s} {dt:5.2f}s')


if __name__ == '__main__':
    main(sys.argv[1:] or None)
