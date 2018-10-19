class Pattern(object):
    def __init__(self):
        self.position = (0, 0)
        self.survival = []
        self.birth = []
        self.pattern = []


def extract(lines):
    retval = Pattern()
    for line in lines:
        line = line.strip()
        if line == '#N':
            retval.survival = [2,3]
            retval.birth = [3]
        elif line.startswith('#R'):
            survival, birth = line[2:].lstrip().split('/')
            retval.survival = list(map(lambda x: int(x), survival))
            retval.birth = list(map(lambda x: int(x), birth))
        elif line.startswith('#P'):
            x, y = line[2:].lstrip().split()
            retval.position = (int(x), int(y))
        elif line.startswith('#') or line == '':
            continue
        else:
            row = []
            for c in line:
                if c == '.':
                    row.append(0)
                elif c == '*':
                    row.append(1)
            retval.pattern.append(row)

    return retval


def extract_from_file(path):
    content = open(path, 'r').readlines()
    return extract(content)


if __name__ == '__main__':
    result = extract_from_file('acorn.lif')
