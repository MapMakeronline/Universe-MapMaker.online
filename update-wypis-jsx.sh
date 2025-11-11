#!/bin/bash
# Update WypisConfigModal.tsx JSX section for THREE separate sections

FILE="c:/Users/Bartosz/Desktop/Universe-MapMaker.online/src/features/mapa/komponenty/WypisConfigModal.tsx"

# Replace newArrangementName with newGeneralArrangementName
sed -i 's/newArrangementName\[layer\.id\]/newGeneralArrangementName[layer.id]/g' "$FILE"
sed -i 's/setNewArrangementName({ ...newArrangementName/setNewGeneralArrangementName({ ...newGeneralArrangementName/g' "$FILE"

# Replace layer.arrangements with layer.generalArrangements
sed -i 's/layer\.arrangements\.map/layer.generalArrangements.map/g' "$FILE"

# Update function calls to include 'general' parameter
sed -i "s/onClick={() => addArrangement(layer\.id)}/onClick={() => addArrangement(layer.id, 'general')}/g" "$FILE"
sed -i "s/onClick={() => deleteArrangement(layer\.id, arr\.name)}/onClick={() => deleteArrangement(layer.id, arr.name, 'general')}/g" "$FILE"
sed -i "s/onDrop={(files) => handleArrangementFileDrop(layer\.id, arr\.name, files)}/onDrop={(files) => handleArrangementFileDrop(layer.id, arr.name, files, 'general')}/g" "$FILE"
sed -i "s/onRemove={() => removeArrangementFile(layer\.id, arr\.name)}/onRemove={() => removeArrangementFile(layer.id, arr.name, 'general')}/g" "$FILE"

# Update heading
sed -i 's/Ustalenia ogólne (arrangements)/Ustalenia ogólne/g' "$FILE"

echo "Updated WypisConfigModal.tsx JSX section!"
