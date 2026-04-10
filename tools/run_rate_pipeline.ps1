$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$pythonCandidates = @(
  (Join-Path $repoRoot ".venv\Scripts\python.exe"),
  "python",
  "py -3"
)

$selected = $null
foreach ($candidate in $pythonCandidates) {
  try {
    if ($candidate -like "*.exe") {
      if (Test-Path $candidate) {
        & $candidate --version *> $null
        $selected = $candidate
        break
      }
    }
    else {
      Invoke-Expression "$candidate --version" *> $null
      $selected = $candidate
      break
    }
  }
  catch {
  }
}

if (-not $selected) {
  throw "Python 3 was not found. Install Python or create .venv first."
}

Write-Host "Refreshing Bank of Zambia USD/ZMW rate file..."

if ($selected -like "*.exe") {
  & $selected (Join-Path $scriptDir "fetch_boz_rate.py")
}
else {
  Invoke-Expression "$selected `"$scriptDir\fetch_boz_rate.py`""
}

Write-Host "Wrote data\exchange-rate.generated.js"
