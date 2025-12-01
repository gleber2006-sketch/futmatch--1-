# Script para adicionar integração do MatchParticipantsModal no MatchDetailsModal.tsx
$filePath = "c:\Users\Gleber\Documents\Futmatch\futmatch--1-\components\MatchDetailsModal.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content -Path $filePath -Raw

# 1. Adicionar import do MatchParticipantsModal
$importPattern = "(import { supabase } from '../services/supabaseClient';)"
$importReplacement = "`$1`nimport MatchParticipantsModal from './MatchParticipantsModal';"
$content = $content -replace $importPattern, $importReplacement

# 2. Adicionar estado showParticipantsModal
$statePattern = "(\[isBoosting, setIsBoosting\] = useState\(false\);)"
$stateReplacement = "`$1`n  const [showParticipantsModal, setShowParticipantsModal] = useState(false);"
$content = $content -replace $statePattern, $stateReplacement

# 3. Adicionar botão "Ver Participantes" antes do botão "Chat da Partida"
$buttonPattern = "(<button onClick={onNavigateToDirectChat \? \(\) => onNavigateToDirectChat\(match\.id\) : undefined})"
$buttonReplacement = @"
<button
              onClick={() => setShowParticipantsModal(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold py-3 rounded-lg shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <UsersIcon /> <span className="inline">Ver Participantes ({match.filled_slots})</span>
            </button>
            `$1
"@
$content = $content -replace $buttonPattern, $buttonReplacement

# 4. Adicionar renderização do modal antes do fechamento do componente
$closePattern = "(\s+</div>\s+</div>\s+\);\s+};\s+export default MatchDetailsModal;)"
$modalReplacement = @"

      {/* Modal de Participantes */}
      {showParticipantsModal && (
        <MatchParticipantsModal
          match={match}
          currentUser={currentUser}
          onClose={() => setShowParticipantsModal(false)}
        />
      )}
`$1
"@
$content = $content -replace $closePattern, $modalReplacement

# Salvar o arquivo modificado
$content | Set-Content -Path $filePath -NoNewline

Write-Host "Sucesso! MatchDetailsModal.tsx foi atualizado com:" -ForegroundColor Green
Write-Host "  ✓ Import do MatchParticipantsModal" -ForegroundColor Cyan
Write-Host "  ✓ Estado showParticipantsModal" -ForegroundColor Cyan
Write-Host "  ✓ Botão 'Ver Participantes'" -ForegroundColor Cyan
Write-Host "  ✓ Renderização do modal" -ForegroundColor Cyan
