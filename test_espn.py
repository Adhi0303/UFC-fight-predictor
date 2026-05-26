import asyncio
import httpx
from datetime import datetime

async def fetch_espn():
    url = "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard"
    current_year = datetime.now().year
    
    espn_bouts = []
    async with httpx.AsyncClient() as client:
        try:
            # Fetch for the current year and the next year to cover all upcoming events
            # ESPN accepts ?dates=YYYY
            responses = await asyncio.gather(
                client.get(f"{url}?limit=100&dates={current_year}", timeout=10.0),
                client.get(f"{url}?limit=100&dates={current_year + 1}", timeout=10.0)
            )
            
            for res in responses:
                if res.status_code == 200:
                    data = res.json()
                    for event in data.get("events", []):
                        event_name = event.get("name", "UFC Event")
                        for comp in event.get("competitions", []):
                            competitors = comp.get("competitors", [])
                            if len(competitors) == 2:
                                f_a = competitors[0].get("athlete", {}).get("displayName", "")
                                f_b = competitors[1].get("athlete", {}).get("displayName", "")
                                rounds = comp.get("format", {}).get("regulation", {}).get("periods", 3)
                                espn_bouts.append({
                                    "event_name": event_name,
                                    "fighter_a": f_a,
                                    "fighter_b": f_b,
                                    "rounds": rounds
                                })
        except Exception as e:
            print("Error:", e)
            
    return espn_bouts

if __name__ == "__main__":
    bouts = asyncio.run(fetch_espn())
    for b in bouts[:5]:
        print(b)
    print("Total bouts:", len(bouts))
