# PowerShell script to update WypisConfigModal.tsx with three separate sections

$filePath = "c:\Users\Bartosz\Desktop\Universe-MapMaker.online\src\features\mapa\komponenty\WypisConfigModal.tsx"
$content = Get-Content $filePath -Raw

# 1. Update interface to have generalArrangements and finalArrangements
$content = $content -replace "arrangements: WypisArrangementWithFile\[\]", "generalArrangements: WypisArrangementWithFile[]`r`n  finalArrangements: WypisArrangementWithFile[]"

# 2. Update initial state in layer creation
$content = $content -replace "arrangements: \[\]", "generalArrangements: []`r`n        finalArrangements: []"

# 3. Update addArrangement function to accept type parameter
$oldAddArrangement = @"
  const addArrangement = useCallback\(\(layerId: string\) => \{
    const name = newArrangementName\[layerId\]
    if \(!name\?\./trim\(\)\) return

    setPlanLayers\(layers =>
      layers.map\(layer =>
        layer.id === layerId
          \? \{ ...layer, arrangements: \[...layer.arrangements, \{ name, fileName: '', file: undefined \}\] \}
          : layer
      \)
    \)
    setNewArrangementName\(\{ ...newArrangementName, \[layerId\]: '' \}\)
  \}, \[newArrangementName\]\)
"@

$newAddArrangement = @"
  const addArrangement = useCallback((layerId: string, type: 'general' | 'final') => {
    const name = type === 'general' ? newGeneralArrangementName[layerId] : newFinalArrangementName[layerId]
    if (!name?.trim()) return

    setPlanLayers(layers =>
      layers.map(layer =>
        layer.id === layerId
          ? {
              ...layer,
              generalArrangements: type === 'general'
                ? [...layer.generalArrangements, { name, fileName: '', file: undefined }]
                : layer.generalArrangements,
              finalArrangements: type === 'final'
                ? [...layer.finalArrangements, { name, fileName: '', file: undefined }]
                : layer.finalArrangements,
            }
          : layer
      )
    )
    if (type === 'general') {
      setNewGeneralArrangementName({ ...newGeneralArrangementName, [layerId]: '' })
    } else {
      setNewFinalArrangementName({ ...newFinalArrangementName, [layerId]: '' })
    }
  }, [newGeneralArrangementName, newFinalArrangementName])
"@

$content = $content -replace [regex]::Escape($oldAddArrangement), $newAddArrangement

# Save updated content
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "✅ Updated WypisConfigModal.tsx with three separate sections"
