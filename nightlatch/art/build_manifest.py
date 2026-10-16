"""Write public/assets/manifest.json listing every generated asset the game should load."""
import json
import os

from core import out_path


def main():
    root = out_path()
    rooms = sorted(d for d in os.listdir(os.path.join(root, 'rooms'))
                   if os.path.exists(os.path.join(root, 'rooms', d, 'room.json')))
    chars_index = os.path.join(root, 'chars', 'index.json')
    chars = json.load(open(chars_index)) if os.path.exists(chars_index) else []
    docs_dir = os.path.join(root, 'docs')
    docs = sorted(os.path.splitext(f)[0] for f in os.listdir(docs_dir) if f.endswith('.png')) if os.path.isdir(docs_dir) else []
    man = {'rooms': rooms, 'chars': chars, 'items': [], 'ui': ['ui'], 'docs': docs}
    with open(os.path.join(root, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1)
    print('manifest:', len(rooms), 'rooms,', len(chars), 'chars,', len(docs), 'doc images')


if __name__ == '__main__':
    main()
