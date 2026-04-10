import json
import re
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen


API_URL = "https://www.boz.zm/api/v1/views/boz_zmw_usd_daily_exchange_rates"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "data" / "exchange-rate.generated.js"
TIME_RE = re.compile(r'datetime="([^"]+)"')


def fetch_payload():
    request = Request(
        API_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; BloomBudget/1.0; +local-script)",
            "Accept": "application/json",
        },
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def parse_rate_row(row):
    time_markup = unescape(str(row.get("time", "")))
    match = TIME_RE.search(time_markup)
    if not match:
        raise ValueError("Could not find datetime attribute in BoZ time field")

    effective_at = datetime.fromisoformat(match.group(1).replace("Z", "+00:00"))
    buying = float(row["buying"])
    selling = float(row["selling"])
    mid_rate = row.get("mid_rate")
    mid_rate = float(mid_rate) if mid_rate not in (None, "") else (buying + selling) / 2

    return {
        "pair": "USD/ZMW",
        "source": "Bank of Zambia",
        "endpoint": API_URL,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "effectiveAt": effective_at.isoformat(),
        "effectiveDate": effective_at.date().isoformat(),
        "buying": buying,
        "midRate": mid_rate,
        "selling": selling,
    }


def select_latest(payload):
    rows = []
    for row in payload:
        try:
            parsed = parse_rate_row(row)
        except Exception:
            continue
        rows.append(parsed)

    if not rows:
        raise ValueError("No usable rows found in Bank of Zambia response")

    rows.sort(key=lambda item: item["effectiveAt"], reverse=True)
    return rows[0]


def write_output(rate):
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    output = "window.BOZ_EXCHANGE_RATE = " + json.dumps(rate, indent=2) + ";\n"
    OUTPUT_PATH.write_text(output, encoding="utf-8")


def main():
    payload = fetch_payload()
    latest = select_latest(payload)
    write_output(latest)
    print(json.dumps(latest, indent=2))


if __name__ == "__main__":
    main()
