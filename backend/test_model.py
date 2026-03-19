from model import recommend

song = input("Enter song name: ")

results = recommend(song)

print("\nRecommended Songs:")
for r in results:
    print(r)
