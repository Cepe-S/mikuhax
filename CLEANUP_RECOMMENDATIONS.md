# Haxbotron Cleanup Recommendations

## Files to Remove (Low/No Utility)

### Debug Commands
- `core/game/controller/commands/debugpowershot.ts` - Debug command for powershot system
- `core/game/controller/commands/debugtop20.ts` - Debug command for TOP 20 cache  
- `core/game/controller/commands/memide.ts` - Inappropriate joke command

### Sample/Template Files
- `core/game/resource/strings.sample.en.ts` - Unused sample strings file

### Minimal Utility Components
- `core/game/model/ExposeLibs/EmergencyTools.ts` - Console tools (can use direct console)
- `core/game/controller/QDetector.ts` - Overly complex "q" spam detector
- `core/game/controller/Translator.ts` - Simple string interpolation (can be inlined)

### Log Files (Add to .gitignore)
- `core/.logs/` directory (all log files)
- `db/.logs/` directory (all log files)

## Files to Consider Reducing

### Real Teams Data (Potentially Oversized)
- `core/game/resource/real_teams.json` (16,000+ lines) - Consider reducing team count
- `core/game/resource/real_matches.json` - Could be simplified
- `core/game/resource/realTeams.ts` - Complex loader system

## Consolidation Opportunities

### Commands That Could Be Merged
- `asistidores.ts` + `goleadores.ts` → Single stats command
- `connectionstats.ts` → Integrate into main stats command

## Estimated Space Savings
- Debug commands: ~15KB
- Sample files: ~10KB  
- Log files: ~50MB+ (varies)
- Real teams data: ~500KB (if reduced by 50%)
- Utility components: ~20KB

**Total estimated savings: ~50MB+ and cleaner codebase**

## Implementation Priority
1. **High**: Remove debug commands and inappropriate content
2. **High**: Add log files to .gitignore and remove from repo
3. **Medium**: Remove sample/template files
4. **Medium**: Consolidate similar commands
5. **Low**: Reduce real teams data (if not heavily used)

## Notes
- Always backup before removing files
- Test thoroughly after removing debug commands
- Consider user impact before removing real teams data
- Update documentation after cleanup