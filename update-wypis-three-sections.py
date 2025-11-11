#!/usr/bin/env python3
"""
Update WypisConfigModal.tsx to have THREE separate sections:
1. Przeznaczenia terenu (purposes) - auto from column
2. Ustalenia ogolne (generalArrangements) - custom names
3. Ustalenia koncowe (finalArrangements) - custom names
"""

import re

file_path = r"c:\Users\Bartosz\Desktop\Universe-MapMaker.online\src\features\mapa\komponenty\WypisConfigModal.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update PlanLayerState interface
content = re.sub(
    r'  arrangements: WypisArrangementWithFile\[\]',
    '  generalArrangements: WypisArrangementWithFile[]\n  finalArrangements: WypisArrangementWithFile[]',
    content
)

# 2. Update useState declaration
content = re.sub(
    r'const \[newArrangementName, setNewArrangementName\] = useState<Record<string, string>>\(\{\}\)',
    '''const [newGeneralArrangementName, setNewGeneralArrangementName] = useState<Record<string, string>>({})
  const [newFinalArrangementName, setNewFinalArrangementName] = useState<Record<string, string>>({})''',
    content
)

# 3. Update layer initialization
content = re.sub(
    r'        arrangements: \[\]',
    '        generalArrangements: []\n        finalArrangements: []',
    content
)

# 4. Update loaded config mapping
content = re.sub(
    r"          arrangements: loaded\['planLayers'\]\[i\]\['arrangements'\]\.map\(\(arr: any\) => \(\{",
    '''          generalArrangements: loaded['planLayers'][i]['generalArrangements']?.map((arr: any) => ({
            name: arr.name,
            fileName: arr.fileName,
            file: undefined,
          })) || [],
          finalArrangements: loaded['planLayers'][i]['finalArrangements']?.map((arr: any) => ({''',
    content
)

# 5. Update addArrangement function signature and implementation
old_add_arrangement = r'''const addArrangement = useCallback\(\(layerId: string\) => \{
    const name = newArrangementName\[layerId\]\?\.trim\(\)
    if \(!name\) \{
      dispatch\(showNotification\(\{ message: 'Wprowadź nazwę ustalenia', severity: 'error' \}\)\)
      return
    \}

    setPlanLayers\(layers =>
      layers\.map\(layer => \{
        if \(layer\.id !== layerId\) return layer

        const exists = layer\.arrangements\.some\(arr => arr\.name === name\)
        if \(exists\) \{
          dispatch\(showNotification\(\{ message: 'Ustalenie o tej nazwie już istnieje', severity: 'error' \}\)\)
          return layer
        \}

        return \{
          \.\.\.layer,
          arrangements: \[\.\.\.layer\.arrangements, \{ name, fileName: '', file: undefined \}\],
        \}
      \}\)
    \)

    setNewArrangementName\(prev => \(\{ \.\.\.prev, \[layerId\]: '' \}\)\)
  \}, \[newArrangementName, dispatch\]\)'''

new_add_arrangement = '''const addArrangement = useCallback((layerId: string, type: 'general' | 'final') => {
    const name = type === 'general'
      ? newGeneralArrangementName[layerId]?.trim()
      : newFinalArrangementName[layerId]?.trim()

    if (!name) {
      dispatch(showNotification({ message: 'Wprowadź nazwę ustalenia', severity: 'error' }))
      return
    }

    setPlanLayers(layers =>
      layers.map(layer => {
        if (layer.id !== layerId) return layer

        const targetArray = type === 'general' ? layer.generalArrangements : layer.finalArrangements
        const exists = targetArray.some(arr => arr.name === name)
        if (exists) {
          dispatch(showNotification({ message: 'Ustalenie o tej nazwie już istnieje', severity: 'error' }))
          return layer
        }

        return {
          ...layer,
          generalArrangements: type === 'general'
            ? [...layer.generalArrangements, { name, fileName: '', file: undefined }]
            : layer.generalArrangements,
          finalArrangements: type === 'final'
            ? [...layer.finalArrangements, { name, fileName: '', file: undefined }]
            : layer.finalArrangements,
        }
      })
    )

    if (type === 'general') {
      setNewGeneralArrangementName(prev => ({ ...prev, [layerId]: '' }))
    } else {
      setNewFinalArrangementName(prev => ({ ...prev, [layerId]: '' }))
    }
  }, [newGeneralArrangementName, newFinalArrangementName, dispatch])'''

content = re.sub(old_add_arrangement, new_add_arrangement, content, flags=re.DOTALL)

# 6. Update handleArrangementFileDrop function
old_handle_drop = r'''const handleArrangementFileDrop = useCallback\(\(layerId: string, arrangementName: string, files: File\[\]\) => \{
    if \(files\.length === 0\) return

    const file = files\[0\]
    const fileName = file\.name

    setPlanLayers\(layers =>
      layers\.map\(layer => \{
        if \(layer\.id !== layerId\) return layer

        return \{
          \.\.\.layer,
          arrangements: layer\.arrangements\.map\(arr =>
            arr\.name === arrangementName
              \? \{ \.\.\.arr, file, fileName \}
              : arr
          \),
        \}
      \}\)
    \)
  \}, \[\]\)'''

new_handle_drop = '''const handleArrangementFileDrop = useCallback((layerId: string, arrangementName: string, files: File[], type: 'general' | 'final') => {
    if (files.length === 0) return

    const file = files[0]
    const fileName = file.name

    setPlanLayers(layers =>
      layers.map(layer => {
        if (layer.id !== layerId) return layer

        return {
          ...layer,
          generalArrangements: type === 'general'
            ? layer.generalArrangements.map(arr =>
                arr.name === arrangementName ? { ...arr, file, fileName } : arr
              )
            : layer.generalArrangements,
          finalArrangements: type === 'final'
            ? layer.finalArrangements.map(arr =>
                arr.name === arrangementName ? { ...arr, file, fileName } : arr
              )
            : layer.finalArrangements,
        }
      })
    )
  }, [])'''

content = re.sub(old_handle_drop, new_handle_drop, content, flags=re.DOTALL)

# 7. Update removeArrangementFile function
old_remove_file = r'''const removeArrangementFile = useCallback\(\(layerId: string, arrangementName: string\) => \{
    setPlanLayers\(layers =>
      layers\.map\(layer => \{
        if \(layer\.id !== layerId\) return layer

        return \{
          \.\.\.layer,
          arrangements: layer\.arrangements\.map\(arr =>
            arr\.name === arrangementName
              \? \{ \.\.\.arr, file: undefined, fileName: '' \}
              : arr
          \),
        \}
      \}\)
    \)
  \}, \[\]\)'''

new_remove_file = '''const removeArrangementFile = useCallback((layerId: string, arrangementName: string, type: 'general' | 'final') => {
    setPlanLayers(layers =>
      layers.map(layer => {
        if (layer.id !== layerId) return layer

        return {
          ...layer,
          generalArrangements: type === 'general'
            ? layer.generalArrangements.map(arr =>
                arr.name === arrangementName ? { ...arr, file: undefined, fileName: '' } : arr
              )
            : layer.generalArrangements,
          finalArrangements: type === 'final'
            ? layer.finalArrangements.map(arr =>
                arr.name === arrangementName ? { ...arr, file: undefined, fileName: '' } : arr
              )
            : layer.finalArrangements,
        }
      })
    )
  }, [])'''

content = re.sub(old_remove_file, new_remove_file, content, flags=re.DOTALL)

# 8. Update deleteArrangement function
old_delete = r'''const deleteArrangement = useCallback\(\(layerId: string, arrangementName: string\) => \{
    setPlanLayers\(layers =>
      layers\.map\(layer => \{
        if \(layer\.id !== layerId\) return layer

        return \{
          \.\.\.layer,
          arrangements: layer\.arrangements\.filter\(arr => arr\.name !== arrangementName\),
        \}
      \}\)
    \)
  \}, \[\]\)'''

new_delete = '''const deleteArrangement = useCallback((layerId: string, arrangementName: string, type: 'general' | 'final') => {
    setPlanLayers(layers =>
      layers.map(layer => {
        if (layer.id !== layerId) return layer

        return {
          ...layer,
          generalArrangements: type === 'general'
            ? layer.generalArrangements.filter(arr => arr.name !== arrangementName)
            : layer.generalArrangements,
          finalArrangements: type === 'final'
            ? layer.finalArrangements.filter(arr => arr.name !== arrangementName)
            : layer.finalArrangements,
        }
      })
    )
  }, [])'''

content = re.sub(old_delete, new_delete, content, flags=re.DOTALL)

# 9. Update handleSave function to include both arrangement types
content = re.sub(
    r"          arrangements: pl\.arrangements\.map\(a => \(\{ name: a\.name, fileName: a\.fileName \}\)\),",
    '''          generalArrangements: pl.generalArrangements.map(a => ({ name: a.name, fileName: a.fileName })),
          finalArrangements: pl.finalArrangements.map(a => ({ name: a.name, fileName: a.fileName })),''',
    content
)

# 10. Update ZIP file creation
content = re.sub(
    r"        for \(const arrangement of layer\.arrangements\) \{",
    '''        for (const arrangement of layer.generalArrangements) {
          if (arrangement.file) {
            const folderName = `${layer.name}/generalArrangements`
            const content = await arrangement.file.arrayBuffer()
            zip.file(`${folderName}/${arrangement.fileName}`, content)
          }
        }

        for (const arrangement of layer.finalArrangements) {''',
    content
)

# Save updated content
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Successfully updated WypisConfigModal.tsx with THREE separate sections!")
print("   1. Przeznaczenia terenu (purposes)")
print("   2. Ustalenia ogolne (generalArrangements)")
print("   3. Ustalenia koncowe (finalArrangements)")
