import requests
import json

def test_espn_past_results():
    url = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?limit=100&dates=2026"
    resp = requests.get(url)
    if resp.status_code == 200:
        data = resp.json()
        events = data.get("events", [])
        for event in events:
            status = event.get("competitions", [{}])[0].get("status", {}).get("type", {}).get("name", "")
            if status == "STATUS_FINAL":
                comp = event.get("competitions", [{}])[0]
                print(json.dumps(comp, indent=2))
                break
    else:
        print("Failed to fetch data")

if __name__ == "__main__":
    test_espn_past_results()
