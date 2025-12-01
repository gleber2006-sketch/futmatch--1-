# Script para adicionar onClick ao botão Ver Participantes
$filePath = "c:\Users\Gleber\Documents\Futmatch\futmatch--1-\components\MatchDetailsModal.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content -Path $filePath -Raw

# Procurar pelo botão Ver Participantes e adicionar onClick
$pattern = '(<button\s+className="w-full bg-gradient-to-r from-purple-600 to-purple-400[^>]*>)'
$replacement = '<button onClick={() => setShowParticipantsModal(true)} className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2">'

# Fazer a substituição
$newContent = $content -replace $pattern, $replacement

# Verificar se a substituição foi feita
if ($content -eq $newContent) {
    Write-Host "AVISO: Nenhuma substituição foi feita. O botão pode já ter o onClick ou não foi encontrado." -ForegroundColor Yellow
} else {
    # Salvar o arquivo modificado
    $newContent | Set-Content -Path $filePath -NoNewline
    Write-Host "Sucesso! onClick adicionado ao botão Ver Participantes" -ForegroundColor Green
}
