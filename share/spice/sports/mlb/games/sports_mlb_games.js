(function (env) {
    "use strict";

    env.ddg_spice_sports_mlb_games = function(apiResult) {

        if (!apiResult || !apiResult.data || !apiResult.data.games || !apiResult.data.games.length) {
            return Spice.failed('mlb_games');
        }
        
        DDG.require('moment.js', function(){
            Spice.add({
                id: 'mlb_games',
                name: 'MLB Games',

                allowMultipleCalls: true,

                data: gameData(apiResult.data),

                model: apiResult.model,
                from: apiResult.from,
                signal: apiResult.signal,

                noDetail: true,
                itemsExpand: true,
                expandItems: true,
                mostRelevant: apiResult.data.most_relevant_game_id,

                meta: {
                    idField: 'id',
                    showMoreAt: true,
                    sourceIcon: false,
                    sourceUrl: "http://www.bleacherreport.com/",
                    sourceName: 'Bleacher Report',
                    secondaryText: (!is_mobile) ? '<span class="tx-clr--grey-dark">Data from SportsData</span>' : false,
                    hideModeSwitch: true,
                    variableTileWidth: true,
                    itemType: "Games"
                },

                templates: {
                    item: apiResult.templates.item
                },
                
                normalize: function(attrs) {
                    attrs.canExpand = false;
                    
                    // Game Finished/In-Progress
                    if (attrs.has_started) {
                        attrs.canExpand = true;
                        
                        var inning = attrs.score.away.innings.length-1 || -1,
                            placeholderStr = (attrs.has_ended) ? '<span class="tx-clr--grey-light">&bull;</span>' : '&nbsp;';
                        
                        if (attrs.score.pitch_count) {
                            inning = attrs.score.pitch_count.inning-1;
                            
                            // always display placeholders up to 9 innings
                            for(var i=inning+1; i < 9; i++) {
                                attrs.score.home.innings[i] = 
                                attrs.score.away.innings[i] = { 
                                    runs: "", 
                                    number: i+1, 
                                    sequence: i+1, 
                                    type: "inning" 
                                };
                            }
                            
                            // mark current inning
                            if (attrs.score.pitch_count.inning_half === "B") {
                                attrs.score.home.innings[inning].current = true;
                                attrs.score.pitch_count.half_over = true;
                            } else {
                                attrs.score.away.innings[inning].current = true;
                            }
                        }
                        
                        if (inning > -1 && attrs.score.home.innings[inning].runs === 'X') {
                            // replace un-played inning 'X' with something more stylish
                            attrs.score.home.innings[inning].runs = placeholderStr;
                        }
                    }
                    
                    return attrs;
                }
            });
        });
        
        var gameData = function(data) {
            if (!DDG.device.isMobile || !data.most_relevant_game_id) {
                return data.games; 
            } else if (DDG.device.isMobile && data.most_relevant_game_id) {
                var foundRelevant = false,
                    games = [],
                    i = 0;
                // for historical games on the first call, 
                // only add the most relevant game and one previous
                // (if available)
                for (; i < data.games.length; i++) {
                    if (data.games[i].id === data.most_relevant_game_id) {
                        if (!DDG.device.isMobileLandscape() && data.games[i-1]) { games.push(data.games[i-1]); }
                        games.push(data.games[i]);
                        foundRelevant = true;
                    } else {
                        if (foundRelevant) {
                            games.push(data.games[i]);
                        } else {
                            continue;
                        }
                    }
                }
                return games;
            }
        }
    }

}(this));