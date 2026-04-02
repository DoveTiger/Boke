$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$composeFile = Join-Path $root "infra\\docker\\docker-compose.backend.yml"
$envFile = Join-Path $root "infra\\docker\\.env"

$args = @("-f", $composeFile)
if (Test-Path -LiteralPath $envFile) {
  $args += @("--env-file", $envFile)
}
$args += "down"

docker compose @args
