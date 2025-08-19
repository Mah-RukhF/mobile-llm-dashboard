# Mobile LLM Performance Analytics Dashboard

A static, client-side dashboard for analyzing mobile LLM experiment exports. Runs from a single HTML page with Chart.js; no build tools required.

## Quick Start

- Open docs/index.html in a browser, or
- Enable GitHub Pages (Settings → Pages → Deploy from branch → main, folder: /docs), then visit:
  https://<user-or-org>.github.io/<repo>/ 

## Load Data

- Click “Upload JSON” and select an exported experiment file
- Or add files to docs/data/ and click “Browse hosted data”

Optional: add docs/data/index.json to customize the hosted list:
```json
{
    "updatedAt": "2025-08-19T10:00:00Z",
    "sessions": [
        { "name": "Qwen vs Llama (Q8) Thermals", "file": "./data/qwen_llama_q8_2025-08-15.json" }
    ]
}
```

## Expected JSON Schema (simplified)

```json
{
    "sessionInfo": {
        "sessionId": "string",
        "duration": 11433,
        "startTime": 1755269523744,
        "endTime": 1755269535177
    },
    "inferences": [
        {
            "model": "Qwen2.5-0.5B-Instruct",
            "quantLevel": "Q8_0.gguf",
            "duration": 1474,
            "tokens": 24,
            "phases": {
                "prefill": { "duration": 218, "tokenCount": 15, "tokensPerSecond": 68.8 },
                "decode": { "duration": 1240, "tokenCount": 25, "tokensPerSecond": 20.16 }
            }
        }
    ],
    "performanceData": {
        "academicMetrics": {
            "systemCorrelation": {
                "dvfsDataByPhase": {
                    "decode": [
                        { "timestamp": 1755269525746, "avgFrequency": 1536000, "tokens": 1 }
                    ]
                }
            },
            "cpuUsageByPhase": { "decode": [ { "timestamp": 1755269525731, "processCpu": 61.44 } ] },
            "memoryUsageByPhase": { "decode": [ { "timestamp": 1755269525731, "processMemory": 1074.37 } ] }
        }
    }
}
```

## Notes

- All processing is done locally in the browser; no data is uploaded anywhere.
- Chart.js is loaded via CDN.
- For large JSON files, consider splitting by session for faster loads.
