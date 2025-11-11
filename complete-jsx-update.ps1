# PowerShell script to complete WypisConfigModal.tsx JSX updates for THREE sections

$filePath = "c:\Users\Bartosz\Desktop\Universe-MapMaker.online\src\features\mapa\komponenty\WypisConfigModal.tsx"
$content = Get-Content $filePath -Raw

# Read the section that needs THREE parts
$oldSection = @'
                      <Divider sx={{ my: 3 }} />

                      <Typography variant="h6" sx={{ mb: 2 }}>Ustalenia ogólne (arrangements)</Typography>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Nazwa ustalenia"
                          value={newArrangementName[layer.id] || ''}
                          onChange={(e) => setNewArrangementName({ ...newArrangementName, [layer.id]: e.target.value })}
                          fullWidth
                          size="small"
                          placeholder="np. Rozdział 1"
                        />
                        <Button
                          variant="contained"
                          onClick={() => addArrangement(layer.id)}
                          startIcon={<AddIcon />}
                          disabled={!newArrangementName[layer.id]?.trim()}
                        >
                          Dodaj
                        </Button>
                      </Box>

                      <List>
                        {layer.arrangements.map(arr => (
                          <ListItem key={arr.name} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{arr.name}</Typography>
                              <IconButton size="small" onClick={() => deleteArrangement(layer.id, arr.name)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <FileDropZone
                              file={arr.file}
                              onDrop={(files) => handleArrangementFileDrop(layer.id, arr.name, files)}
                              onRemove={() => removeArrangementFile(layer.id, arr.name)}
                            />
                          </ListItem>
                        ))}
                      </List>
'@

$newSection = @'
                      <Divider sx={{ my: 3 }} />

                      {/* SECTION 2: Ustalenia ogólne (generalArrangements) */}
                      <Typography variant="h6" sx={{ mb: 2 }}>Ustalenia ogólne</Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Przeciągnij pliki DOC/DOCX dla ustaleń ogólnych
                      </Alert>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Nazwa ustalenia ogólnego"
                          value={newGeneralArrangementName[layer.id] || ''}
                          onChange={(e) => setNewGeneralArrangementName({ ...newGeneralArrangementName, [layer.id]: e.target.value })}
                          fullWidth
                          size="small"
                          placeholder="np. Rozdział 1"
                        />
                        <Button
                          variant="contained"
                          onClick={() => addArrangement(layer.id, 'general')}
                          startIcon={<AddIcon />}
                          disabled={!newGeneralArrangementName[layer.id]?.trim()}
                        >
                          Dodaj
                        </Button>
                      </Box>

                      <List>
                        {layer.generalArrangements.map(arr => (
                          <ListItem key={arr.name} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{arr.name}</Typography>
                              <IconButton size="small" onClick={() => deleteArrangement(layer.id, arr.name, 'general')}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <FileDropZone
                              file={arr.file}
                              onDrop={(files) => handleArrangementFileDrop(layer.id, arr.name, files, 'general')}
                              onRemove={() => removeArrangementFile(layer.id, arr.name, 'general')}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Divider sx={{ my: 3 }} />

                      {/* SECTION 3: Ustalenia końcowe (finalArrangements) */}
                      <Typography variant="h6" sx={{ mb: 2 }}>Ustalenia końcowe</Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Przeciągnij pliki DOC/DOCX dla ustaleń końcowych
                      </Alert>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Nazwa ustalenia końcowego"
                          value={newFinalArrangementName[layer.id] || ''}
                          onChange={(e) => setNewFinalArrangementName({ ...newFinalArrangementName, [layer.id]: e.target.value })}
                          fullWidth
                          size="small"
                          placeholder="np. Załącznik A"
                        />
                        <Button
                          variant="contained"
                          onClick={() => addArrangement(layer.id, 'final')}
                          startIcon={<AddIcon />}
                          disabled={!newFinalArrangementName[layer.id]?.trim()}
                        >
                          Dodaj
                        </Button>
                      </Box>

                      <List>
                        {layer.finalArrangements.map(arr => (
                          <ListItem key={arr.name} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{arr.name}</Typography>
                              <IconButton size="small" onClick={() => deleteArrangement(layer.id, arr.name, 'final')}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <FileDropZone
                              file={arr.file}
                              onDrop={(files) => handleArrangementFileDrop(layer.id, arr.name, files, 'final')}
                              onRemove={() => removeArrangementFile(layer.id, arr.name, 'final')}
                            />
                          </ListItem>
                        ))}
                      </List>
'@

$content = $content -replace [regex]::Escape($oldSection), $newSection

# Save
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "SUCCESS: Updated JSX to render THREE separate sections!"
