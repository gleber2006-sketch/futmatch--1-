# Script para atualizar a query fetchMatches no App.tsx
$filePath = "c:\Users\Gleber\Documents\Futmatch\futmatch--1-\App.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content -Path $filePath -Raw

# Padrão a ser substituído (usando regex para ser mais preciso)
$oldPattern = "\.from\('matches'\)\s*\.select\('\*'\)"

# Novo padrão
$newPattern = ".from('matches')`n                .select('*, match_participants(user_id, status, joined_at, waitlist_position, profiles(photo_url, name))')"

# Fazer a substituição
$newContent = $content -replace $oldPattern, $newPattern

# Verificar se a substituição foi feita
if ($content -eq $newContent) {
    Write-Host "ERRO: Nenhuma substituição foi feita. O padrão não foi encontrado." -ForegroundColor Red
    exit 1
} else {
    # Salvar o arquivo modificado
    $newContent | Set-Content -Path $filePath -NoNewline
    Write-Host "Sucesso! A query foi atualizada em App.tsx" -ForegroundColor Green
    Write-Host "Modificação aplicada: .select('*') -> .select('*, match_participants(...)')" -ForegroundColor Cyan
}
