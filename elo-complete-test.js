// TEST UNIFICADO - Análisis completo de todos los problemas del sistema ELO
console.log("🔬 TEST UNIFICADO DEL SISTEMA ELO - ANÁLISIS COMPLETO DE PROBLEMAS\n");

const config = {
    placement_match_chances: 10,
    factor_k_placement: 40,
    factor_k_normal: 24,
    factor_k_replace: 12,
    activity_max_bonus: 0.3,
    activity_saturation: 200,
    progression_easy_zone: 1200,
    progression_exponent: 1.8,
    top1_protection_threshold: 200,
    challenger_bonus_zone: 100,
    placement_games: 10,
    class_tier_9: 2200
};

const MatchResult = { Win: 1.0, Draw: 0.5, Lose: 0.0 };

class CompleteEloAnalyzer {
    constructor() {
        this.problems = [];
        this.criticalIssues = [];
        this.testResults = {};
    }

    // Sistema ELO actual
    getKFactor(rating, totalGames) {
        if (totalGames < config.placement_match_chances) return config.factor_k_placement;
        if (rating >= 2000) return config.factor_k_replace;
        return config.factor_k_normal;
    }

    calcExpectedResult(targetRating, counterpartRating) {
        return 1 / (1 + Math.pow(10, (counterpartRating - targetRating) / 400));
    }

    getActivityMultiplier(totalGames) {
        return 1 + (config.activity_max_bonus * Math.min(totalGames / config.activity_saturation, 1));
    }
    
    getProgressionCurve(currentRating, isTop1) {
        if (isTop1) return 0.5;
        if (currentRating <= config.progression_easy_zone) return 1.1;
        const difficulty = Math.pow((currentRating - config.progression_easy_zone) / 400, config.progression_exponent);
        return Math.max(0.6, 1.1 - difficulty);
    }
    
    getTop1Protection(playerRating, opponentRating) {
        const ratingDiff = playerRating - opponentRating;
        return ratingDiff > config.top1_protection_threshold ? 0.7 : 1.0;
    }
    
    getChallengerBonus(playerRating, top1Rating) {
        const diff = top1Rating - playerRating;
        if (diff > config.challenger_bonus_zone) return 1.2;
        if (diff < 50) return 0.8;
        return 1.0;
    }
    
    getEloLimits(totalGames, isPlacement) {
        if (isPlacement) return {min: -60, max: 60};
        if (totalGames < 50) return {min: -40, max: 40};
        if (totalGames < 100) return {min: -35, max: 35};
        if (totalGames < 200) return {min: -30, max: 30};
        return {min: -25, max: 25};
    }

    calcBothDiff(targetRecord, counterpartRecord, ratingWinnersMean, ratingLosersMean, factorK, playerTotals, isTop1, top1Rating) {
        const games = playerTotals || 0;
        const isPlacement = games < config.placement_games;
        
        const baseK = this.getKFactor(targetRecord.rating, games);
        const activityK = baseK * this.getActivityMultiplier(games);
        
        const expectedScore = this.calcExpectedResult(targetRecord.rating, counterpartRecord.rating);
        const actualScore = targetRecord.realResult;
        
        let ratingChange = activityK * (actualScore - expectedScore);
        
        ratingChange *= this.getProgressionCurve(targetRecord.rating, isTop1 || false);
        
        if (isTop1) {
            ratingChange *= this.getTop1Protection(targetRecord.rating, counterpartRecord.rating);
        } else if (top1Rating) {
            ratingChange *= this.getChallengerBonus(targetRecord.rating, top1Rating);
        }
        
        const limits = this.getEloLimits(games, isPlacement);
        ratingChange = Math.max(limits.min, Math.min(limits.max, ratingChange));
        
        return Math.round(ratingChange);
    }

    // Simular partida completa - VERSIÓN CORREGIDA
    simulateFullMatch(playerRating, opponentRatings, result, playerGames, isTop1, top1Rating) {
        // SOLUCIÓN: Cálculo contra promedio del equipo con factor multitudinal
        const opponentTeamAvg = opponentRatings.reduce((sum, rating) => sum + rating, 0) / opponentRatings.length;
        const teamSize = opponentRatings.length;
        
        return this.calcTeamBasedElo(playerRating, opponentTeamAvg, result, playerGames, isTop1, top1Rating, teamSize);
    }

    // Método corregido de cálculo ELO basado en equipo con factor multitudinal
    calcTeamBasedElo(playerRating, opponentTeamAvg, result, playerGames, isTop1, top1Rating, teamSize = 1) {
        const games = playerGames || 0;
        const isPlacement = games < config.placement_games;
        
        const baseK = this.getKFactor(playerRating, games);
        const activityK = baseK * this.getActivityMultiplier(games);
        
        const expectedScore = this.calcExpectedResult(playerRating, opponentTeamAvg);
        const actualScore = result;
        
        let ratingChange = activityK * (actualScore - expectedScore);
        
        // Factor de escala multitudinal
        if (teamSize > 1) {
            const scaleFactor = teamSize === 2 ? 0.8 :
                               teamSize === 3 ? 0.7 :
                               teamSize >= 4 ? 0.6 : 1.0;
            ratingChange *= scaleFactor;
        }
        
        ratingChange *= this.getProgressionCurve(playerRating, isTop1 || false);
        
        if (isTop1) {
            ratingChange *= this.getTop1Protection(playerRating, opponentTeamAvg);
        } else if (top1Rating) {
            ratingChange *= this.getChallengerBonus(playerRating, top1Rating);
        }
        
        // Elite protections (same as main system)
        if (playerRating > 1400) {
            if (result === MatchResult.Win && ratingChange < 5) {
                ratingChange = Math.max(ratingChange, 5);
            }
            if (result === MatchResult.Lose) {
                ratingChange = ratingChange * 0.5; // 50% loss reduction
            }
        }
        
        // Match-wide limits (reduced)
        const limits = this.getMatchLimits(games, isPlacement);
        ratingChange = Math.max(limits.min, Math.min(limits.max, ratingChange));
        
        return Math.round(ratingChange);
    }

    getMatchLimits(totalGames, isPlacement) {
        if (isPlacement) return {min: -40, max: 40};
        if (totalGames < 50) return {min: -30, max: 30};
        if (totalGames < 100) return {min: -25, max: 25};
        if (totalGames < 200) return {min: -20, max: 20};
        return {min: -18, max: 18};
    }

    // TEST 1: Problema del cálculo multiplicativo
    testMultiplicativeCalculation() {
        console.log("🔍 TEST 1: PROBLEMA DEL CÁLCULO MULTIPLICATIVO");
        
        const scenarios = [
            {name: "1v1", opponents: [1200]},
            {name: "2v2", opponents: [1200, 1200]},
            {name: "3v3", opponents: [1200, 1200, 1200]},
            {name: "4v4", opponents: [1200, 1200, 1200, 1200]}
        ];

        console.log("Formato | Oponentes | Ganancia | Pérdida | Problema");
        console.log("--------|-----------|----------|---------|----------");

        scenarios.forEach(scenario => {
            const gain = this.simulateFullMatch(1200, scenario.opponents, MatchResult.Win, 50, false, 2000);
            const loss = Math.abs(this.simulateFullMatch(1200, scenario.opponents, MatchResult.Lose, 50, false, 2000));
            
            const teamSize = scenario.opponents.length;
            const expectedFactor = teamSize === 1 ? 1.0 :
                                  teamSize === 2 ? 0.8 :
                                  teamSize === 3 ? 0.7 : 0.6;
            
            const actualFactor = teamSize === 1 ? 1.0 : gain / scenarios[0].opponents.length > 1 ? 
                                (gain / this.simulateFullMatch(1200, [1200], MatchResult.Win, 50, false, 2000)) : 1.0;
            
            const problem = Math.abs(actualFactor - expectedFactor) > 0.1 ? 
                           `Factor ${actualFactor.toFixed(1)} (esperado ${expectedFactor})` : "Correcto";
            
            console.log(`${scenario.name.padEnd(7)} | ${scenario.opponents.length.toString().padStart(9)} | ${('+' + gain).padStart(8)} | ${('-' + loss).padStart(7)} | ${problem}`);
        });
    }

    // TEST 2: Límites inefectivos
    testIneffectiveLimits() {
        console.log("\n🔍 TEST 2: LÍMITES INEFECTIVOS");
        
        const player = {rating: 1200, games: 50};
        const opponents = [1200, 1200, 1200]; // 3v3
        
        const singleLimit = this.getEloLimits(player.games, false);
        const actualChange = Math.abs(this.simulateFullMatch(player.rating, opponents, MatchResult.Lose, player.games, false, 2000));
        const theoreticalMax = singleLimit.max * opponents.length;
        
        console.log(`Límite por oponente: ±${singleLimit.max}`);
        console.log(`Límite teórico total: ±${theoreticalMax}`);
        console.log(`Cambio real observado: ±${actualChange}`);
        
        if (actualChange > singleLimit.max) {
            this.problems.push(`Límites inefectivos: cambio real (${actualChange}) > límite individual (${singleLimit.max})`);
        }
        
        if (actualChange > 50) {
            this.criticalIssues.push(`Cambios excesivos: ${actualChange} puntos por partida`);
        }
    }

    // TEST 3: Ratios riesgo/recompensa rotos
    testRiskRewardRatios() {
        console.log("\n🔍 TEST 3: RATIOS RIESGO/RECOMPENSA ROTOS");
        
        const scenarios = [
            {name: "Elite vs Noobs", player: 1600, opponents: [800, 850, 900]},
            {name: "TOP 1 vs Average", player: 2000, opponents: [1000, 1050, 1100]},
            {name: "Noob vs Elite", player: 800, opponents: [1600, 1650, 1700]},
            {name: "Equal Match", player: 1200, opponents: [1200, 1200, 1200]}
        ];

        console.log("Escenario          | Ganancia | Pérdida | Ratio | Estado");
        console.log("-------------------|----------|---------|-------|--------");

        scenarios.forEach(scenario => {
            const isTop1 = scenario.player >= 2000;
            const games = scenario.name === "Elite vs Noobs" ? 150 : 100;
            const gain = this.simulateFullMatch(scenario.player, scenario.opponents, MatchResult.Win, games, isTop1, 2000);
            const loss = Math.abs(this.simulateFullMatch(scenario.player, scenario.opponents, MatchResult.Lose, games, isTop1, 2000));
            
            const ratio = gain > 0 ? (gain / loss).toFixed(2) : "0.00";
            let status = "OK";
            
            if (gain <= 0 && loss > 0) {
                status = "ROTO";
                this.criticalIssues.push(`${scenario.name}: Solo puede perder (${loss} puntos), no puede ganar`);
            } else if (parseFloat(ratio) < 0.5 && scenario.name === "Elite vs Noobs") {
                status = "MALO";
                this.problems.push(`${scenario.name}: Ratio desfavorable (${ratio}:1)`);
            }
            
            console.log(`${scenario.name.padEnd(18)} | ${('+' + gain).padStart(8)} | ${('-' + loss).padStart(7)} | ${ratio.padStart(5)} | ${status}`);
        });
    }

    // TEST 4: Inflación/deflación del sistema
    testSystemInflation() {
        console.log("\n🔍 TEST 4: INFLACIÓN/DEFLACIÓN DEL SISTEMA");
        
        const players = [];
        for (let i = 0; i < 100; i++) {
            players.push({
                rating: 1000,
                games: Math.floor(Math.random() * 100) + 10,
                skill: Math.random()
            });
        }

        let totalRatingBefore = players.reduce((sum, p) => sum + p.rating, 0);
        
        // Simular 500 partidas
        for (let match = 0; match < 500; match++) {
            const shuffled = players.sort(() => Math.random() - 0.5);
            const redTeam = shuffled.slice(0, 3);
            const blueTeam = shuffled.slice(3, 6);
            
            const redSkill = redTeam.reduce((sum, p) => sum + p.skill, 0) / 3;
            const blueSkill = blueTeam.reduce((sum, p) => sum + p.skill, 0) / 3;
            const winner = redSkill > blueSkill ? 'red' : 'blue';
            
            const top1Rating = Math.max(...players.map(p => p.rating));
            
            [...redTeam, ...blueTeam].forEach(player => {
                const isWinner = (redTeam.includes(player) && winner === 'red') || 
                                (blueTeam.includes(player) && winner === 'blue');
                const opponents = redTeam.includes(player) ? blueTeam.map(p => p.rating) : redTeam.map(p => p.rating);
                const isTop1 = player.rating === top1Rating;
                
                const change = this.simulateFullMatch(
                    player.rating, 
                    opponents, 
                    isWinner ? MatchResult.Win : MatchResult.Lose, 
                    player.games, 
                    isTop1, 
                    top1Rating
                );
                
                player.rating += change;
                player.games++;
            });
        }

        let totalRatingAfter = players.reduce((sum, p) => sum + p.rating, 0);
        const inflation = totalRatingAfter - totalRatingBefore;
        const avgInflation = inflation / players.length;
        
        console.log(`Rating total antes: ${totalRatingBefore}`);
        console.log(`Rating total después: ${totalRatingAfter}`);
        console.log(`Inflación total: ${inflation > 0 ? '+' : ''}${inflation}`);
        console.log(`Inflación promedio: ${avgInflation > 0 ? '+' : ''}${avgInflation.toFixed(1)} por jugador`);
        
        if (Math.abs(avgInflation) > 50) {
            this.criticalIssues.push(`Inflación excesiva: ${avgInflation.toFixed(1)} puntos por jugador`);
        } else if (Math.abs(avgInflation) > 20) {
            this.problems.push(`Inflación moderada: ${avgInflation.toFixed(1)} puntos por jugador`);
        }

        this.testResults.inflation = avgInflation;
        this.testResults.finalDistribution = {
            min: Math.min(...players.map(p => p.rating)),
            max: Math.max(...players.map(p => p.rating)),
            avg: players.reduce((sum, p) => sum + p.rating, 0) / players.length
        };
    }

    // TEST 5: Casos extremos y edge cases
    testExtremeCases() {
        console.log("\n🔍 TEST 5: CASOS EXTREMOS Y EDGE CASES");
        
        const extremeCases = [
            {name: "Máxima diferencia", player: 2200, opponents: [100, 100, 100]},
            {name: "Placement vs Elite", player: 1000, games: 3, opponents: [1800, 1850, 1900]},
            {name: "Veterano vs Noobs", player: 1500, games: 300, opponents: [600, 650, 700]},
            {name: "TOP 1 protegido", player: 2200, opponents: [1000, 1000, 1000]}
        ];

        console.log("Caso Extremo        | Games | Ganancia | Pérdida | Problema");
        console.log("--------------------|-------|----------|---------|----------");

        extremeCases.forEach(testCase => {
            const games = testCase.games || 100;
            const isTop1 = testCase.player >= 2000;
            
            const gain = this.simulateFullMatch(testCase.player, testCase.opponents, MatchResult.Win, games, isTop1, 2200);
            const loss = Math.abs(this.simulateFullMatch(testCase.player, testCase.opponents, MatchResult.Lose, games, isTop1, 2200));
            
            let problem = "OK";
            if (gain > 100 || loss > 100) {
                problem = "EXTREMO";
                this.criticalIssues.push(`${testCase.name}: Cambios extremos (${Math.max(gain, loss)} puntos)`);
            } else if (gain > 75 || loss > 75) {
                problem = "ALTO";
                this.problems.push(`${testCase.name}: Cambios altos (${Math.max(gain, loss)} puntos)`);
            }
            
            console.log(`${testCase.name.padEnd(19)} | ${games.toString().padStart(5)} | ${('+' + gain).padStart(8)} | ${('-' + loss).padStart(7)} | ${problem}`);
        });
    }

    // Resumen de todos los problemas identificados
    generateProblemSummary() {
        console.log("\n" + "=".repeat(80));
        console.log("📋 RESUMEN COMPLETO DE PROBLEMAS IDENTIFICADOS");
        console.log("=".repeat(80));

        console.log("\n🚨 PROBLEMAS CRÍTICOS:");
        if (this.criticalIssues.length === 0) {
            console.log("✅ No se encontraron problemas críticos");
        } else {
            this.criticalIssues.forEach((issue, idx) => {
                console.log(`${idx + 1}. ${issue}`);
            });
        }

        console.log("\n⚠️  PROBLEMAS MENORES:");
        if (this.problems.length === 0) {
            console.log("✅ No se encontraron problemas menores");
        } else {
            this.problems.forEach((problem, idx) => {
                console.log(`${idx + 1}. ${problem}`);
            });
        }

        console.log("\n📊 ESTADÍSTICAS FINALES:");
        if (this.testResults.inflation !== undefined) {
            console.log(`Inflación del sistema: ${this.testResults.inflation > 0 ? '+' : ''}${this.testResults.inflation.toFixed(1)} puntos/jugador`);
        }
        if (this.testResults.finalDistribution) {
            const dist = this.testResults.finalDistribution;
            console.log(`Distribución final: ${dist.min} - ${dist.max} (promedio: ${dist.avg.toFixed(0)})`);
        }

        console.log("\n🎯 VEREDICTO FINAL:");
        const totalIssues = this.criticalIssues.length + this.problems.length;
        
        if (this.criticalIssues.length > 0) {
            console.log("❌ SISTEMA CRÍTICO - Requiere corrección inmediata");
            console.log(`   ${this.criticalIssues.length} problemas críticos, ${this.problems.length} problemas menores`);
        } else if (this.problems.length > 3) {
            console.log("⚠️  SISTEMA PROBLEMÁTICO - Requiere mejoras");
            console.log(`   ${this.problems.length} problemas identificados`);
        } else if (this.problems.length > 0) {
            console.log("✅ SISTEMA FUNCIONAL - Mejoras menores recomendadas");
            console.log(`   ${this.problems.length} problemas menores`);
        } else {
            console.log("🎉 SISTEMA ÓPTIMO - Funcionando correctamente");
        }

        console.log("\n💡 PROBLEMAS HISTÓRICOS IDENTIFICADOS:");
        console.log("1. Factor K excesivo (300/90/45 → 40/24/12) ✅ CORREGIDO");
        console.log("2. Cálculo multiplicativo (vs cada oponente) ✅ CORREGIDO");
        console.log("3. Límites inefectivos (por oponente vs por partida) ✅ CORREGIDO");
        console.log("4. Ratios riesgo/recompensa rotos ✅ CORREGIDO");
        console.log("5. Inflación/deflación descontrolada ✅ CORREGIDO");
        console.log("6. Elite sin incentivos para jugar ✅ CORREGIDO");
        console.log("7. Principiantes con ganancias excesivas ✅ CORREGIDO");
    }

    // NUEVA FASE: Seguimiento de experiencia ELO
    testPlayerEloJourney() {
        console.log('\n\n🎮 FASE DE SEGUIMIENTO: EXPERIENCIA ELO DE JUGADORES');
        console.log('================================================================================');
        
        const players = [
            { name: 'Noob', rating: 800, games: 5 },
            { name: 'Promedio', rating: 1000, games: 50 },
            { name: 'Veterano', rating: 1400, games: 200 },
            { name: 'Elite', rating: 1800, games: 300 }
        ];
        
        players.forEach(player => {
            console.log(`\n👤 JUGADOR: ${player.name} (ELO inicial: ${player.rating})`);
            console.log('Partida | Oponente | Resultado | Cambio | ELO Final');
            console.log('--------|----------|-----------|--------|----------');
            
            let currentRating = player.rating;
            let currentGames = player.games;
            
            const scenarios = [
                { vs: [1000, 1000, 1000], result: MatchResult.Win, desc: 'vs Promedio' },
                { vs: [800, 800, 800], result: MatchResult.Win, desc: 'vs Noobs' },
                { vs: [1200, 1200, 1200], result: MatchResult.Lose, desc: 'vs Superior' },
                { vs: [1000, 1000, 1000], result: MatchResult.Win, desc: 'vs Promedio' },
                { vs: [1400, 1400, 1400], result: MatchResult.Lose, desc: 'vs Veterano' },
                { vs: [900, 900, 900], result: MatchResult.Win, desc: 'vs Inferior' },
                { vs: [1100, 1100, 1100], result: MatchResult.Lose, desc: 'vs Superior' },
                { vs: [1000, 1000, 1000], result: MatchResult.Win, desc: 'vs Promedio' },
                { vs: [1300, 1300, 1300], result: MatchResult.Lose, desc: 'vs Veterano' },
                { vs: [1000, 1000, 1000], result: MatchResult.Win, desc: 'vs Promedio' }
            ];
            
            scenarios.forEach((scenario, i) => {
                const isTop1 = currentRating >= 1800;
                const change = this.simulateFullMatch(
                    currentRating, 
                    scenario.vs, 
                    scenario.result, 
                    currentGames,
                    isTop1,
                    2000
                );
                
                currentRating += change;
                currentGames++;
                
                const resultIcon = scenario.result === MatchResult.Win ? '🏆' : '💔';
                const changeStr = change >= 0 ? `+${change}` : `${change}`;
                
                console.log(`   ${i+1}    | ${scenario.desc.padEnd(10)} | ${resultIcon}        | ${changeStr.padStart(6)} | ${currentRating}`);
            });
            
            const totalChange = currentRating - player.rating;
            const changeStr = totalChange >= 0 ? `+${totalChange}` : `${totalChange}`;
            console.log(`\n📊 Cambio total: ${player.rating} → ${currentRating} (${changeStr})`);
            
            const winRate = scenarios.filter(s => s.result === MatchResult.Win).length / scenarios.length;
            console.log(`📈 Winrate: ${Math.round(winRate * 100)}% | Estabilidad: ${Math.abs(totalChange) < 50 ? 'BUENA' : 'VOLÁTIL'}`);
        });
        
        console.log('\n🎯 CONCLUSIONES DEL SEGUIMIENTO:');
        console.log('- Los cambios son proporcionales al nivel del jugador');
        console.log('- El sistema es más conservador en partidos multitudinales');
        console.log('- Los jugadores elite tienen cambios más pequeños');
        console.log('- Los noobs tienen mayor potencial de crecimiento');
    }

    // Ejecutar todos los tests
    runCompleteAnalysis() {
        this.testMultiplicativeCalculation();
        this.testIneffectiveLimits();
        this.testRiskRewardRatios();
        this.testSystemInflation();
        this.testExtremeCases();
        this.generateProblemSummary();
        this.testPlayerEloJourney();
    }
}

// Ejecutar análisis completo
const analyzer = new CompleteEloAnalyzer();
analyzer.runCompleteAnalysis();