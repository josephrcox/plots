"""Set fields on buildings in src/lib/objects/PlotTypeOptions.ts.

Usage: python3 sim/patch_options.py  (edits CHANGES below in place)
Each change: (building id, "section.key" or "key", value).
"""
import re, sys

PATH = "src/lib/objects/PlotTypeOptions.ts"


def block_bounds(src, bid):
    m = re.search(r'\n\s+id: "%s",' % re.escape(bid), src)
    if not m:
        sys.exit(f"no building {bid}")
    # Block runs from the '{' before the id to the matching '}'.
    start = src.rfind("{", 0, m.start())
    depth = 0
    for i in range(start, len(src)):
        if src[i] == "{":
            depth += 1
        elif src[i] == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1
    sys.exit("unbalanced")


def set_field(block, path, value):
    parts = path.split(".")
    lo, hi = 1, len(block) - 1  # inside the building's own braces
    # Narrow to each nested section in turn ("requirements.resources.stone").
    for sec in parts[:-1]:
        m = re.compile(r"\n(\s+)%s: \{" % sec).search(block, lo, hi)
        if not m:
            sys.exit(f"no section {sec}")
        depth, i = 1, m.end()
        while depth:
            depth += {"{": 1, "}": -1}.get(block[i], 0)
            i += 1
        lo, hi = m.end(), i - 1
    key = parts[-1]
    seg = block[lo:hi]
    if isinstance(value, bool):
        lit = str(value).lower()
    elif isinstance(value, str):
        lit = '"%s"' % value.replace('"', '\\"')
    else:
        lit = str(value)
    # The first match at this level: nested sections come after plain keys
    # in this file, so search plain keys outside any nested braces.
    depth = 0
    for m in re.finditer(r"\n(\s+)(\w+): ([^,\n{]+)(,)|[{}]", seg):
        tok = m.group(0)
        if tok == "{":
            depth += 1
        elif tok == "}":
            depth -= 1
        elif depth == 0 and m.group(2) == key:
            seg = seg[: m.start(3)] + lit + seg[m.end(3):]
            return block[:lo] + seg + block[hi:]
    sys.exit(f"no key {path}")


def apply(changes):
    src = open(PATH).read()
    for bid, path, value in changes:
        a, b = block_bounds(src, bid)
        src = src[:a] + set_field(src[a:b], path, value) + src[b:]
    open(PATH, "w").write(src)


if __name__ == "__main__":
    import json
    apply(json.load(open(sys.argv[1])))
