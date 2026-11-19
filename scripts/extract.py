"""Extract room texts and door coordinates from asweigart/mazewebsite.

Usage: python3 -I scripts/extract.py <path-to-mazewebsite-clone> <out.json>
Only parses literals (ast.literal_eval); never executes the source.
"""
import ast, json, re, sys

src_dir, out = sys.argv[1], sys.argv[2]
tree = ast.parse(open(f"{src_dir}/src/generate_mazewebsite_html.py", encoding="utf-8").read())
values = {}
for node in tree.body:
    if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
        name = node.targets[0].id
        if name in ("text", "image_map_data"):
            values[name] = ast.literal_eval(node.value)

def paragraphs(html):
    return [p.strip() for p in re.findall(r"<p>(.*?)</p>", html, re.S) if p.strip()]

rooms = []
for n in range(1, 46):
    doors = []
    for target, shape, coords in values["image_map_data"].get(n, []):
        pts = [int(c) for c in coords.split(",")]
        if shape == "rect":
            x1, y1, x2, y2 = pts
            pts = [x1, y1, x2, y1, x2, y2, x1, y2]
        doors.append({"to": int(target), "points": pts})
    rooms.append({"n": n, "paragraphs": paragraphs(values["text"][n]), "doors": doors})

json.dump({"rooms": rooms}, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("rooms:", len(rooms), "doors:", sum(len(r["doors"]) for r in rooms))
