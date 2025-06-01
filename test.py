from itertools import permutations

def getPages(pages, threshold):
    n = len(pages)
    max_total = 0

    for order in permutations(range(n)):
        active = [False] * n
        active_count = 0
        total = 0

        for i in order:
            active[i] = True
            active_count += 1
            total += pages[i]

            # Suspension check
            for j in range(n):
                if active[j] and threshold[j] <= active_count:
                    active[j] = False
                    active_count -= 1

        max_total = max(max_total, total)

    return max_total

pages = [2, 6, 10, 13]
threshold = [2, 1, 1, 1]

print(getPages(pages, threshold))  # Output: 15


