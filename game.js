// Game state
const gameState = {
    players: [],
    team: [],
    teamRatings: {},
    opponents: [],
    coins: 100,
    postersBought: false,
    yourTeamName: "",
    wins: 0,
    draws: 0,
    loses: 0,
    prefinal_res: 0,
    final_res: 0,
    currentMatch: 0,
    inPlayoff: false,
    currentOpponent: "",
    currentOpponentRating: 0,
    tempBoost: 0,         
    postersBought: false,   
    playerPoster: null,
    currentTransferMarket: [],
    playoffOpponent: "",
    finalOpponent: ""  
};

// DOM elements
const screenTitle = document.getElementById('screen-title');
const screenContent = document.getElementById('screen-content');
const screenActions = document.getElementById('screen-actions');
const screenMessages = document.getElementById('screen-messages');

// Utility functions
function clearScreen() {
    screenContent.innerHTML = '';
    screenActions.innerHTML = '';
    screenMessages.innerHTML = '';
}

function addMessage(text) {
    const message = document.createElement('div');
    message.className = 'match-event';
    message.textContent = text;
    screenMessages.appendChild(message);
    screenMessages.scrollTop = screenMessages.scrollHeight;
}

function addAction(text, callback) {
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.textContent = text;
    button.addEventListener('click', callback);
    screenActions.appendChild(button);
}

function addInputAction(text, placeholder, callback) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    input.className = 'input-field';
    screenActions.appendChild(input);

    const button = document.createElement('button');
    button.className = 'action-btn';
    button.textContent = text;
    button.addEventListener('click', () => callback(input.value));
    screenActions.appendChild(button);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateBasicRating(players) {
    return players.reduce((sum, player) => sum + player.rating, 0);
}

function calculateTeamwork(players) {
    const teamCounts = {};
    players.forEach(player => {
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
    });
    
    let teamwork = 0;
    for (const team in teamCounts) {
        if (teamCounts[team] >= 2) {
            teamwork += teamCounts[team] * (teamCounts[team] - 1) / 2;
        }
    }
    
    return teamwork;
}

function calculateTeamRating(players, tempBoost = 0) {
    const totalRating = players.reduce((sum, player) => sum + player.rating, 0);
    
    const teamCounts = {};
    players.forEach(player => {
        teamCounts[player.team] = (teamCounts[player.team] || 0) + 1;
    });
    
    let teamwork = 0;
    for (const team in teamCounts) {
        if (teamCounts[team] >= 2) {
            teamwork += teamCounts[team] * (teamCounts[team] - 1) / 2;
        }
    }
    
    return totalRating + teamwork + tempBoost;
}

function displayTeam(team, tempBoost = 0) {
    const teamList = document.createElement('ul');
    teamList.className = 'player-list';
    
    team.forEach((player, index) => {
        const playerItem = document.createElement('li');
        playerItem.className = 'player-item';
        
        playerItem.innerHTML = `
            ${index + 1}. ${player.name} 
                (<img src="images_of_teams/${player.team}.png" class="team-logo">
                ${player.team})
            </span>
            - ${player.pos_pic}${player.pos} - ⭐${player.rating}
        `;
        
        teamList.appendChild(playerItem);
    });
    
    screenContent.appendChild(teamList);
    
    const statsContainer = document.createElement('div');
    statsContainer.className = 'team-stats-container';

    // Базовый рейтинг
    const basicRatingDisplay = document.createElement('div');
    basicRatingDisplay.className = 'rating-display basic-rating';
    basicRatingDisplay.innerHTML = `
        <span class="stat-icon">🔢</span>
        <span class="stat-text">Базовый рейтинг:</span>
        <span class="stat-value">${calculateBasicRating(team)}</span>
    `;

    // Сыгранность (Teamwork)
    const teamworkDisplay = document.createElement('div');
    teamworkDisplay.className = 'rating-display teamwork';
    teamworkDisplay.innerHTML = `
        <span class="stat-icon">🤝</span>
        <span class="stat-text">Сыгранность:</span>
        <span class="stat-value">+${calculateTeamwork(team)}</span>
    `;

    const totalRatingDisplay = document.createElement('div');
    totalRatingDisplay.className = 'rating-display total-rating';
    totalRatingDisplay.innerHTML = `
        <span class="stat-icon">📊</span>
        <span class="stat-text">Общий рейтинг:</span>
        <span class="stat-value">${calculateTeamRating(team, tempBoost)}⭐</span>
    `;

    // Добавляем все элементы в контейнер
    statsContainer.appendChild(basicRatingDisplay);
    statsContainer.appendChild(teamworkDisplay);
    statsContainer.appendChild(totalRatingDisplay);

    // Добавляем контейнер в DOM
    screenContent.appendChild(statsContainer);
}

function displayRules() {
    clearScreen();
    screenTitle.textContent = '📜 Правила игры';
    
    const rulesDiv = document.createElement('div');
    rulesDiv.className = 'rules-screen';
    
    const rules = [
        "👥 <strong>Состав команды:</strong> В вашей команде 5 игроков: 2 нападающих ⚽, 2 защитника 🛡️ и 1 вратарь 🧤",
        "⭐ <strong>Рейтинг игроков:</strong> Игроки имеют рейтинг от 1 до 10 (можно повысить до 12 с помощью тренировок 📈)",
        "📊 <strong>Командный рейтинг:</strong> Сумма рейтингов + бонус за сыгранность (+1, если пара игроков из одной команды РПЛ 🏆)",
        "🏟️ <strong>Турнирная система:</strong> Сначала групповой этап (3 матча ⏱️), затем плей-офф, если вы набрали 4 очка ✅",
        "🪙 <strong>Футкоины:</strong> За победы (+50) и ничьи (+20) получаете футкоины для улучшения команды 💸",
        "🛒 <strong>Улучшения:</strong> Тратьте футкоины на: новых игроков 👥, тренировки 🏋️‍♂️ или плакаты 🖼️",
        "🔄 <strong>Покупка/продажа игроков:</strong> Чтобы купить нового игрока, нужно продать одного из своей команды (с той же позиции) ↔️",
        "💼 <strong>Комиссия:</strong> При покупке/продаже: комиссия 20 футкоинов + разница между ценами игроков 💰",
        "🏃‍♂️ <strong>Тренировки:</strong> Бывают: футбольные (+2/3 к рейтингу 👟) и физподготовка (+1/2 к рейтингу 💪)",
        "🖼️ <strong>Плакаты:</strong> Дают +1/2 к рейтингу на один матч + ваш рисунок для поддержки 🎨",
        "🎯 <strong>Цель игры:</strong> Заработать как можно больше футкоинов, побеждая в турнире! 💰🏆"
    ];
    
    rules.forEach(rule => {
        const p = document.createElement('p');
        p.innerHTML = rule;
        rulesDiv.appendChild(p);
    });
    
    screenContent.appendChild(rulesDiv);
    addAction('Назад ⬅️', showMatchPreparationScreen);
}

function formTeam(players) {
    const forwards = players.filter(player => player.pos === 'Нап');
    const defenders = players.filter(player => player.pos === 'Защ');
    const goalkeepers = players.filter(player => player.pos === 'Врт');

    if (forwards.length < 2 || defenders.length < 2 || goalkeepers.length < 1) {
        throw new Error("Недостаточно игроков для формирования команды!");
    }

    const selectedForwards = [];
    const selectedDefenders = [];
    const selectedGoalkeeper = [];

    // Select random players without duplicates
    while (selectedForwards.length < 2) {
        const player = forwards[Math.floor(Math.random() * forwards.length)];
        if (!selectedForwards.some(p => p.name === player.name && p.team === player.team)) {
            selectedForwards.push(player);
        }
    }

    while (selectedDefenders.length < 2) {
        const player = defenders[Math.floor(Math.random() * defenders.length)];
        if (!selectedDefenders.some(p => p.name === player.name && p.team === player.team)) {
            selectedDefenders.push(player);
        }
    }

    selectedGoalkeeper.push(goalkeepers[Math.floor(Math.random() * goalkeepers.length)]);

    return [...selectedForwards, ...selectedDefenders, ...selectedGoalkeeper];
}

function calculateTeamRatings(players) {
    const teams = {};
    players.forEach(player => {
        if (!teams[player.team]) {
            teams[player.team] = [];
        }
        teams[player.team].push(player);
    });

    const teamRatings = {};
    for (const teamName in teams) {
        teamRatings[teamName] = calculateTeamRating(teams[teamName]);
    }

    return teamRatings;
}

function selectOpponents(teamRatings) {
    const availableTeams = Object.keys(teamRatings);
    const opponents = [];
    
    while (opponents.length < 3 && opponents.length < availableTeams.length) {
        const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        if (!opponents.includes(randomTeam)) {
            opponents.push(randomTeam);
        }
    }
    
    return opponents;
}

function startGame() {
    gameState.players = [];
    gameState.team = [];
    gameState.teamRatings = {};
    gameState.opponents = [];
    gameState.coins = 100;  
    gameState.tempBoost = 0;
    gameState.postersBought = false;
    gameState.yourTeamName = "";
    gameState.wins = 0;
    gameState.draws = 0;
    gameState.loses = 0;
    gameState.prefinal_res = 0;
    gameState.final_res = 0;
    gameState.currentMatch = 0;
    gameState.inPlayoff = false;
    gameState.currentOpponent = "";
    gameState.currentOpponentRating = 0;

    clearScreen();

    screenTitle.textContent = 'Футбольный менеджер РПЛ';
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-screen';
    welcomeDiv.innerHTML = `
        <h2>⚽ Футбольный менеджер РПЛ ⚽</h2>
        <img src="https://i.postimg.cc/nhdGkf08/Chat-GPT-Image-17-2025-21-26-33.png" 
             alt="Футбольное поле" style="welcome-screen img">
        <p>Создайте непобедимую команду и выиграйте чемпионат!</p>
    `;
    screenContent.appendChild(welcomeDiv);
    
    addAction('Начать карьеру менеджера', showRulesScreen);
}

function showRulesScreen() {
    clearScreen();
    screenTitle.textContent = '📜 Правила игры';
    
    const rulesDiv = document.createElement('div');
    rulesDiv.className = 'rules-screen';
    
    const rules = [
        "👥 <strong>Состав команды:</strong> В вашей команде 5 игроков: 2 нападающих ⚽, 2 защитника 🛡️ и 1 вратарь 🧤",
        "⭐ <strong>Рейтинг игроков:</strong> Игроки имеют рейтинг от 1 до 10 (можно повысить до 12 с помощью тренировок 📈)",
        "📊 <strong>Командный рейтинг:</strong> Сумма рейтингов + бонус за сыгранность (+1, если пара игроков из одной команды РПЛ 🏆)",
        "🏟️ <strong>Турнирная система:</strong> Сначала групповой этап (3 матча ⏱️), затем плей-офф, если вы набрали 4 очка ✅",
        "🪙 <strong>Футкоины:</strong> За победы (+50) и ничьи (+20) получаете футкоины для улучшения команды 💸",
        "🛒 <strong>Улучшения:</strong> Тратьте футкоины на: новых игроков 👥, тренировки 🏋️‍♂️ или плакаты 🖼️",
        "🔄 <strong>Покупка/продажа игроков:</strong> Чтобы купить нового игрока, нужно продать одного из своей команды (с той же позиции) ↔️",
        "💼 <strong>Комиссия:</strong> При покупке/продаже: комиссия 20 футкоинов + разница между ценами игроков 💰",
        "🏃‍♂️ <strong>Тренировки:</strong> Бывают: футбольные (+2/3 к рейтингу 👟) и физподготовка (+1/2 к рейтингу 💪)",
        "🖼️ <strong>Плакаты:</strong> Дают +1/2 к рейтингу на один матч + ваш рисунок для поддержки 🎨",
        "🎯 <strong>Цель игры:</strong> Заработать как можно больше футкоинов, побеждая в турнире! 💰🏆"
    ];
    
    rules.forEach(rule => {
        const p = document.createElement('p');
        p.innerHTML = rule;
        rulesDiv.appendChild(p);
    });
    
    screenContent.appendChild(rulesDiv);
    
    addAction('Далее ➡️', askForTeamName);
}

function askForTeamName() {
    clearScreen();
    screenTitle.textContent = '🏷️ Название команды';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'welcome-screen';
    infoDiv.innerHTML = `
        <p>Дайте имя вашей команде, которое будет прославлено в турнире!</p>
        <img src="https://i.postimg.cc/FHQkVLjM/image.png" 
             alt="Футбольное поле" style="welcome-screen img">
    `;
    screenContent.appendChild(infoDiv);
    
    addInputAction('Создать команду', 'Введите название команды', (name) => {
        if (name.trim()) {
            gameState.yourTeamName = name.trim();
            loadPlayersAndFormTeam();
        } else {
            addMessage('Пожалуйста, введите название команды');
        }
    });
}

function loadPlayersAndFormTeam() {
    clearScreen();
    screenTitle.textContent = 'Формирование команды';

    fetch('players_rpl.json')
    .then(response => {
        if (!response.ok) throw new Error('Ошибка HTTP: ' + response.status);
        return response.json();
    })
    .then(data => {
        gameState.players = data.footballers;
        gameState.team = formTeam(gameState.players);
        gameState.teamRatings = calculateTeamRatings(gameState.players);
        showTeamAndOpponents();
    })
    .catch(error => {
        console.error('Ошибка загрузки:', error);
        showErrorScreen();
    });
}

function showTeamAndOpponents() {
    clearScreen();
    screenTitle.textContent = 'Ваша команда и соперники';
    
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Ваш баланс: ${gameState.coins}🪙.`;
    screenContent.appendChild(coinsDisplay);
    
    const teamInfo = document.createElement('div');
    teamInfo.innerHTML = `<h3>Ваша команда "${gameState.yourTeamName}":</h3>`;
    screenContent.appendChild(teamInfo);
    
    displayTeam(gameState.team);
    
    gameState.opponents = selectOpponents(gameState.teamRatings);
    
    const opponentsList = document.createElement('div');
    opponentsList.innerHTML = '<h3>Ваши противники в группе:</h3>';
    
    gameState.opponents.forEach((opponent, index) => {
        const p = document.createElement('p');
        p.className = 'opponent-item';
        
        // Текст "Матч X:"
        const matchText = document.createTextNode(`Матч ${index + 1}: `);
        p.appendChild(matchText);
        
        // Контейнер для команды
        const teamSpan = document.createElement('span');
        teamSpan.className = 'opponent-team';
        
        // Логотип команды
        const img = document.createElement('img');
        img.src = `images_of_teams/${opponent}.png`;
        img.className = 'team-logo';
        img.alt = opponent;
        
        // Название команды
        const teamName = document.createTextNode(` ${opponent}`);
        
        // Собираем все вместе
        teamSpan.appendChild(img);
        teamSpan.appendChild(teamName);
        p.appendChild(teamSpan);
        
        // Рейтинг команды
        const ratingText = document.createTextNode(` (Рейтинг: ${gameState.teamRatings[opponent]})`);
        p.appendChild(ratingText);
        
        opponentsList.appendChild(p);
    });
    
    screenContent.appendChild(opponentsList);
    addMessage('Команда сформирована, соперники определены!');
    
    addAction('Начать турнир', () => startMatch(0));
}

function showErrorScreen() {
    clearScreen();
    screenTitle.textContent = 'Ошибка';
    screenContent.textContent = 'Не удалось загрузить данные игроков. Проверьте:';
    
    const list = document.createElement('ul');
    list.innerHTML = `
        <li>Файл players_rpl.json существует</li>
        <li>Файл содержит валидный JSON</li>
        <li>Сервер запущен (используйте Live Server)</li>
    `;
    screenContent.appendChild(list);
}

function startMatch(matchIndex) {
    gameState.currentMatch = matchIndex;
    gameState.currentOpponent = gameState.opponents[matchIndex];
    gameState.currentOpponentRating = gameState.teamRatings[gameState.currentOpponent];
    gameState.tempBoost = 0;
    gameState.postersBought = false;
    generateTransferMarket();
    showMatchPreparationScreen();
}

function showMatchPreparationScreen() {
    // Если мы в плей-офф, возвращаемся на экран плей-офф
    if (gameState.inPlayoff) {
        const stage = gameState.currentOpponent === "Зенит" || gameState.currentOpponent === "Краснодар" 
            ? "Финал" 
            : "Полуфинал";
        showPlayoffScreen(stage);
        return; // Выходим, чтобы не выполнять код ниже
    }

    // Иначе показываем стандартный экран подготовки к матчу группового этапа
    clearScreen();
    screenTitle.textContent = `Матч ${gameState.currentMatch + 1}`;
    
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Ваш баланс: ${gameState.coins}🪙`;
    screenContent.appendChild(coinsDisplay);
    
    const opponentInfo = document.createElement('div');
    opponentInfo.className = 'opponent-info';
    opponentInfo.innerHTML = `
        Ваш противник: 
        <span>
            <img src="images_of_teams/${gameState.currentOpponent}.png" class="team-logo" alt="${gameState.currentOpponent}">
            ${gameState.currentOpponent}
        </span>
        (Рейтинг: ${gameState.currentOpponentRating})
        `;
    screenContent.appendChild(opponentInfo);
    
    const teamInfo = document.createElement('div');
    teamInfo.innerHTML = `<h3>Ваша команда "${gameState.yourTeamName}":</h3>`;
    screenContent.appendChild(teamInfo);
    displayTeam(gameState.team, gameState.tempBoost);
    
    addAction('🔄 1. Покупка/продажа игроков', showTradeScreen);
    addAction('👟 2. Футбольная тренировка (+2 или 3) - 30🪙', () => trainPlayer('football'));
    addAction('💪 3. Тренировка по физподготовке (+1 или 2) - 20🪙', () => trainPlayer('fitness'));
    addAction('🖼️ 4. Плакаты для болельщиков (+1 или 2 на один матч) - 10🪙', tryShowPostersScreen);
    addAction('📜 5. Посмотреть правила игры', displayRules);
    addAction('⚽ 6. Начать матч', playMatch);
}

function showTradeScreen() {
    clearScreen();
    screenTitle.textContent = 'Трансферный рынок';
    
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Ваш баланс: ${gameState.coins}🪙.`;
    screenContent.appendChild(coinsDisplay);
    
    const teamList = document.createElement('div');
    const header = document.createElement('h3');
    header.className = 'transfer-header';
    header.textContent = 'Ваша команда:';
    teamList.appendChild(header);

    gameState.team.forEach((player, index) => {
        const p = document.createElement('p');
        p.className = 'player-item';
        p.innerHTML = `
            ${index + 1}. ${player.name} 
                (<img src="images_of_teams/${player.team}.png" class="team-logo">
                ${player.team})
            </span>
            - ${player.pos_pic}${player.pos} - ⭐${player.rating} - ${player.rating * 10}🪙
        `;
        teamList.appendChild(p);
    });
    screenContent.appendChild(teamList);
    
    const availablePlayersList = document.createElement('div');
    const header2 = document.createElement('h3');
    header2.className = 'transfer-header';
    header2.textContent = 'Доступные игроки в текущем трансферном окне:';
    availablePlayersList.appendChild(header2);

    if (gameState.currentTransferMarket.length === 0) {
        const noPlayers = document.createElement('p');
        noPlayers.textContent = 'Нет доступных игроков в текущем трансферном окне';
        availablePlayersList.appendChild(noPlayers);
    } else {
        const playersByPosition = {
            'Нап': [],
            'Защ': [],
            'Врт': []
        };
        
        gameState.currentTransferMarket.forEach(player => {
            playersByPosition[player.pos].push(player);
        });
        
        for (const pos in playersByPosition) {
            if (playersByPosition[pos].length > 0) {
                const posHeader = document.createElement('h4');
                posHeader.className = 'transfer-position';
                posHeader.textContent = `Позиция: ${pos}`;
                availablePlayersList.appendChild(posHeader);
                
                playersByPosition[pos].forEach((player, index) => {
                    const p = document.createElement('p');
                    p.className = 'player-item-transfer';
                    p.innerHTML = `
                        ${index + 1}. ${player.name} 
                            (<img src="images_of_teams/${player.team}.png" class="team-logo">
                            ${player.team})
                        - ${player.pos_pic}${player.pos} - ⭐${player.rating} - ${player.rating * 10}🪙
                    `;
                    availablePlayersList.appendChild(p);
                });
            }
        }
    }
    screenContent.appendChild(availablePlayersList);

    addInputAction('Выбрать игрока для продажи', 'Введите номер игрока из вашей команды', (input) => {
        const sellId = parseInt(input) - 1;
        if (isNaN(sellId)) {
            addMessage('Пожалуйста, введите число');
            return;
        }
        
        if (sellId >= 0 && sellId < gameState.team.length) {
            showAvailablePlayersForTrade(sellId);
        } else {
            addMessage('Неверный номер игрока');
        }
    });
    
    addAction('Назад ⬅️', showMatchPreparationScreen);
}

function generateTransferMarket() {
    gameState.currentTransferMarket = [];
    
    const positionsNeeded = ['Нап', 'Нап', 'Защ', 'Защ', 'Врт'];
    const usedPlayerIds = new Set(); // Для отслеживания уже выбранных игроков
    
    positionsNeeded.forEach(pos => {
        // Фильтруем игроков по позиции и исключаем уже выбранных
        const availablePlayers = gameState.players.filter(player => 
            player.pos === pos && 
            !gameState.team.some(p => p.name === player.name && p.team === player.team) &&
            !usedPlayerIds.has(`${player.name}|${player.team}`) // Проверяем, что игрок ещё не выбран
        );
        
        // Выбираем до 2 случайных уникальных игроков
        const selectedPlayers = [];
        const maxPlayers = Math.min(2, availablePlayers.length);
        
        while (selectedPlayers.length < maxPlayers && availablePlayers.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePlayers.length);
            const player = availablePlayers.splice(randomIndex, 1)[0]; // Удаляем из доступных
            
            selectedPlayers.push(player);
            usedPlayerIds.add(`${player.name}|${player.team}`); // Добавляем в использованные
        }
        
        gameState.currentTransferMarket.push(...selectedPlayers);
    });
}
function showAvailablePlayersForTrade(sellId) {
    const soldPlayer = gameState.team[sellId];
    const soldPosition = soldPlayer.pos;
    
    // Фильтруем игроков из текущего рынка по позиции
    const availablePlayers = gameState.currentTransferMarket.filter(
        player => player.pos === soldPosition
    );
    
    if (availablePlayers.length === 0) {
        addMessage('Нет доступных игроков на эту позицию в текущем трансферном окне');
        return;
    }
    
    clearScreen();
    screenTitle.textContent = 'Трансферный рынок';
    
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Ваш баланс: ${gameState.coins}🪙.`;
    screenContent.appendChild(coinsDisplay);
    
    const positionTitle = document.createElement('h3');
    positionTitle.textContent = `Доступные игроки на позицию ${soldPosition}:`;
    screenContent.appendChild(positionTitle);
    
    availablePlayers.forEach((player, index) => {
        const p = document.createElement('p');
        p.className = 'player-item';
        p.innerHTML = `
            ${index + 1}. ${player.name} 
                (<img src="images_of_teams/${player.team}.png" class="team-logo">
                ${player.team})
            </span>
            - ${player.pos_pic}${player.pos} - ⭐${player.rating} - ${player.rating * 10}🪙
        `;
        screenContent.appendChild(p);
    });
    
    addInputAction('Купить игрока', 'Введите номер игрока для покупки', (input) => {
        const buyId = parseInt(input) - 1;
        if (isNaN(buyId)) {
            addMessage('Пожалуйста, введите число');
            return;
        }
        
        if (buyId >= 0 && buyId < availablePlayers.length) {
            completeTrade(sellId, availablePlayers[buyId]);
        } else {
            addMessage('Неверный номер игрока');
        }
    });
    
    addAction('Назад ⬅️', showTradeScreen);
}

async function completeTrade(sellId, boughtPlayer) {
    const buttons = document.querySelectorAll('.action-btn');
    const buyButton = buttons[0];
    const cancelButton = buttons[1];

    cancelButton.disabled = true;
    cancelButton.style.opacity = '0.3';
    cancelButton.style.cursor = 'not-allowed';

    buyButton.textContent = 'Готово';
    buyButton.onclick = async () => {
        buyButton.disabled = true;
        showMatchPreparationScreen();
    };

    const soldPlayer = gameState.team[sellId];
    const price = boughtPlayer.rating * 10;
    const sellPrice = soldPlayer.rating * 10;
    const commission = Math.max(20, Math.floor(Math.abs(price - sellPrice)));
    const totalCost = Math.abs(price - sellPrice) + commission;

    if (gameState.coins >= totalCost) {
        // Находим индекс купленного игрока в currentTransferMarket
        const boughtPlayerIndex = gameState.currentTransferMarket.findIndex(p => 
            p.name === boughtPlayer.name && 
            p.team === boughtPlayer.team && 
            p.pos === boughtPlayer.pos
        );

        if (boughtPlayerIndex === -1) {
            addMessage("Ошибка: выбранный игрок больше не доступен!");
            return;
        }

        // 1. Удаляем купленного игрока из currentTransferMarket
        gameState.currentTransferMarket.splice(boughtPlayerIndex, 1);
        
        // 2. Добавляем проданного игрока в currentTransferMarket
        gameState.currentTransferMarket.push(soldPlayer);
        
        // 3. Заменяем игрока в команде
        gameState.team.splice(sellId, 1, boughtPlayer);

        gameState.coins -= totalCost;

        addMessage(`Вы продали ${soldPlayer.name} и купили ${boughtPlayer.name}.`);
        addMessage(`Комиссия за сделку: ${commission}. Разница между ценами игроков: ${Math.abs(price - sellPrice)}`);
        addMessage(`Итоговая стоимость сделки: ${totalCost}🪙`);
        addMessage(`Ваш баланс: ${gameState.coins}🪙.`);
        addMessage(`📊 Новый общий рейтинг команды: ${calculateTeamRating(gameState.team, gameState.tempBoost)}`);
    } else {
        addMessage(`Не хватает 🪙 для покупки! Нужно ${totalCost}🪙, у вас ${gameState.coins}🪙.`);
    }
}

// Training functions
function trainPlayer(trainingType) {
    const cost = trainingType === 'football' ? 30 : 20;
    
    if (gameState.coins < cost) {
        addMessage(`Не хватает🪙! Нужно ${cost}, у вас ${gameState.coins}.`);
        return;
    }
    
    clearScreen();
    screenTitle.textContent = trainingType === 'football' ? 'Футбольная тренировка' : 'Тренировка по физподготовке';
    
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Ваш баланс: ${gameState.coins}🪙.`;
    screenContent.appendChild(coinsDisplay);
    
    const teamList = document.createElement('div');
    teamList.innerHTML = '<h3>Ваша команда:</h3>';
    gameState.team.forEach((player, index) => {
        const p = document.createElement('p');
        p.className = 'player-item';
        p.innerHTML = `
            ${index + 1}. ${player.name} 
                (<img src="images_of_teams/${player.team}.png" class="team-logo">
                ${player.team})
            </span>
            - ${player.pos_pic}${player.pos} - ⭐${player.rating}
        `;
        teamList.appendChild(p);
    });
    screenContent.appendChild(teamList);
    
    addInputAction('Тренировать игрока', 'Введите номер игрока', (input) => {
        const playerId = parseInt(input) - 1;
        if (isNaN(playerId)) {
            addMessage('Пожалуйста, введите число');
            return;
        }
        
        if (playerId >= 0 && playerId < gameState.team.length) {
            completeTraining(trainingType, playerId);
        } else {
            addMessage('Неверный номер игрока');
        }
    });
    
    addAction('Назад ⬅️', showMatchPreparationScreen);
}

async function completeTraining(trainingType, playerId) {
    const player = gameState.team[playerId];
    
    if (player.rating >= 12) {
        addMessage(`Игрок ${player.name} уже достиг максимального рейтинга (12).`);
        return;
    }
    
    const cost = trainingType === 'football' ? 30 : 20;
    
    if (gameState.coins < cost) {
        addMessage(`Не хватает 🪙! Нужно ${cost}🪙, у вас ${gameState.coins}🪙.`);
        return;
    }
    
    // Находим кнопки в DOM
    const buttons = document.querySelectorAll('.action-btn');
    const trainButton = buttons[0]; // Кнопка "Тренировать игрока"
    const cancelButton = buttons[1]; // Кнопка "Назад ⬅️"
    
    // Блокируем и "гасим" обе кнопки
    trainButton.disabled = true;
    trainButton.style.opacity = '0.5';
    trainButton.style.cursor = 'not-allowed';
    
    cancelButton.disabled = true;
    cancelButton.style.opacity = '0.5';
    cancelButton.style.cursor = 'not-allowed';
    
    // Создаем кнопку для показа результатов
    const resultButton = document.createElement('button');
    resultButton.className = 'action-btn';
    resultButton.textContent = 'Показать результат ➡️';
    screenActions.appendChild(resultButton);
    addMessage(`Проводим тренировку игрока ${player.name}...`);
    // Немедленно выполняем тренировку (но не показываем результаты)
    gameState.coins -= cost;
    
    let increase;
    if (trainingType === 'football') {
        increase = Math.random() < 0.5 ? 2 : 3;
    } else {
        increase = Math.random() < 0.5 ? 1 : 2;
    }
    
    player.rating = Math.min(player.rating + increase, 12);
    const newTeamRating = calculateTeamRating(gameState.team, gameState.tempBoost);
    
    // Обработчик для кнопки "Показать результат"
    resultButton.onclick = () => {
        addMessage(`Списано: ${cost}🪙`);
        addMessage(`Ваш баланс: ${gameState.coins}🪙`);
        addMessage(`Игрок ${player.name} улучшил рейтинг на +${increase}`);
        addMessage(`Новый рейтинг: ${player.rating}`);
        addMessage(`📊 Новый общий рейтинг команды: ${newTeamRating}`);
        
        // Удаляем кнопку "Показать результат"
        resultButton.remove();
        
        // Создаем кнопку для возврата в меню
        const returnButton = document.createElement('button');
        returnButton.className = 'action-btn';
        returnButton.textContent = 'Вернуться в меню';
        screenActions.appendChild(returnButton);
        
        // Обработчик для кнопки возврата
        returnButton.onclick = () => {
            // Восстанавливаем исходные кнопки
            trainButton.disabled = false;
            trainButton.style.opacity = '';
            trainButton.style.cursor = '';
            trainButton.textContent = trainingType === 'football' 
                ? 'Футбольная тренировка (+2 или 3) - 30🪙' 
                : 'Тренировка по физподготовке (+1 или 2) - 20🪙';
            
            cancelButton.disabled = false;
            cancelButton.style.opacity = '';
            cancelButton.style.cursor = '';
            
            // Удаляем кнопку возврата
            returnButton.remove();
            
            // Возвращаемся в меню матча
            showMatchPreparationScreen();
        };
    };
    
    // Обработчик отмены (остается заблокированным)
    cancelButton.onclick = showMatchPreparationScreen;
}

function tryShowPostersScreen() {
    // Проверяем, покупались ли уже плакаты
    if (gameState.postersBought) {
        addMessage(`Вы уже купили плакаты для этого матча (+${gameState.tempBoost} к рейтингу)`);
        return;
    }
    
    // Проверяем наличие🪙
    if (gameState.coins < 10) {
        addMessage(`Не хватает🪙! Нужно 10, у вас ${gameState.coins}`);
        return;
    }
    
    // Если все проверки пройдены - показываем экран плакатов
    showPostersScreen();
}

function showPostersScreen() {
    clearScreen();
    screenTitle.textContent = 'Плакаты для болельщиков';
    

    const instructions = document.createElement('p');
    instructions.textContent = 'Нарисуйте плакат для болельщиков (+1-2 к рейтингу на 1 матч)';
    screenContent.appendChild(instructions);
    
    // Canvas для рисования
    const canvas = document.createElement('canvas');
    canvas.id = 'posterCanvas';
    canvas.width = 300;
    canvas.height = 200;
    canvas.style.border = '2px solid #000';
    canvas.style.margin = '10px auto';
    canvas.style.display = 'block';
    canvas.style.backgroundColor = '#fff';
    screenContent.appendChild(canvas);
    
    // Инструменты
    const toolsDiv = document.createElement('div');
    toolsDiv.style.textAlign = 'center';
    
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = '#ff0000';
    
    const brushSize = document.createElement('select');
    brushSize.innerHTML = `
        <option value="3">Тонкая кисть</option>
        <option value="7" selected>Средняя кисть</option>
        <option value="12">Толстая кисть</option>
    `;
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Очистить';
    clearBtn.className = 'action-btn';
    
    toolsDiv.appendChild(colorPicker);
    toolsDiv.appendChild(brushSize);
    toolsDiv.appendChild(clearBtn);
    screenContent.appendChild(toolsDiv);
    
    // Кнопки действий
    if (!gameState.postersBought) {
        addAction('Сохранить плакат (10🪙)', () => {
            if (gameState.coins >= 10) {
                savePoster(canvas);
                showPosterConfirmation();
            } else {
                addMessage('Недостаточно🪙!');
            }
        });
    }
    else {
        addMessage('Вы уже купили постеры!');
    }
    
    addAction('Назад ⬅️', showMatchPreparationScreen);
    
    // Инициализация рисования
    initDrawing(canvas, colorPicker, brushSize, clearBtn);
}

// 3. Функция инициализации рисования (без изменений)
function initDrawing(canvas, colorPicker, brushSize, clearBtn) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorPicker.value;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }
}

// 4. Функция сохранения плаката
function savePoster(canvas) {
    // Сохраняем изображение
    gameState.playerPoster = canvas.toDataURL();
    
    // Определяем бонус (1 с шансом 70%, 2 с шансом 30%)
    gameState.tempBoost = Math.random() < 0.7 ? 1 : 2;
    gameState.postersBought = true;
    gameState.coins -= 10;
}

// 5. Экран подтверждения
function showPosterConfirmation() {
    clearScreen();
    screenTitle.textContent = 'Плакат сохранен!';
    
    const posterImg = document.createElement('img');
    posterImg.src = gameState.playerPoster;
    posterImg.style.maxWidth = '300px';
    posterImg.style.margin = '10px auto';
    posterImg.style.display = 'block';
    posterImg.style.border = '2px solid #000';
    posterImg.style.backgroundColor = '#ffffff'; // Белый фон
    posterImg.style.padding = '10px'; // Отступы чтобы фон был виден
    screenContent.appendChild(posterImg);
    
    const baseRating = calculateTeamRating(gameState.team);
    const newRating = calculateTeamRating(gameState.team, gameState.tempBoost);

    const boostInfo = document.createElement('div');
    boostInfo.innerHTML = `
        <p>Ваш плакат добавлен!</p>
        <p>Бонус к рейтингу: +${gameState.tempBoost}</p>
        <p>Был рейтинг: ${baseRating}</p>
        <p>Теперь рейтинг: ${newRating}</p>
        <p>Действует только на следующий матч</p>
    `;
    screenContent.appendChild(boostInfo);
    
    addAction('Далее ➡️', showMatchPreparationScreen);
}


// Match simulation functions
async function playMatch() {
    clearScreen();
    screenTitle.textContent = `Матч против ${gameState.currentOpponent}`;
    
    const yourRating = calculateTeamRating(gameState.team, gameState.tempBoost);
    const opponentRating = gameState.currentOpponentRating;
    
    const ratingDisplay = document.createElement('div');
    ratingDisplay.className = 'team-rating';
    ratingDisplay.textContent = `Рейтинг вашей команды '${gameState.yourTeamName}': ${yourRating}`;
    screenContent.appendChild(ratingDisplay);
    
    const opponentDisplay = document.createElement('div');
    opponentDisplay.className = 'opponent-info';
    opponentDisplay.textContent = `Рейтинг команды противника: ${opponentRating}`;
    screenContent.appendChild(opponentDisplay);
    
    // Calculate probabilities
    let yourWinProbability = 50 + (yourRating - opponentRating);
    yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
    let oppWinProbability = 100 - yourWinProbability;
    // Random event (50% chance)
    if (Math.random() < 0.5) {
        const randIncident = Math.floor(Math.random() * 7) - 5; // -5 to 5
        let eventText = '';
        
        if (randIncident >= 1 && randIncident <= 3) {
            // Положительные события
            const positiveEvents = [
                `Главный нападающий влюбился, у него невероятный эмоциональный подъем (+${2 * randIncident}% к шансу забить гол)`,
                `Тренер нашел идеальную тактику против соперника (+${2 * randIncident}% к шансу победы)`,
                `Капитан вашей команды пообещал пиво за победу (+${2 * randIncident}% к шансу победы)`
            ];
            eventText = positiveEvents[Math.floor(Math.random() * positiveEvents.length)];
        } else if (randIncident >= -3 && randIncident <= -1) {
            // Отрицательные события
            const negativeEvents = [
                `У нападающего умер хомячок, у него депрессия (${2 * randIncident}% к шансу забить гол)`,
                `Ключевой игрок поссорился с тренером (${2 * randIncident}% к шансу победы)`,
                `Центральный защитник в Теремке и отравился (${2 * randIncident}% к шансу победы)`
            ];
            eventText = negativeEvents[Math.floor(Math.random() * negativeEvents.length)];
        }

        if (eventText) {
            addMessage('⚡ Случайное событие!');
            addMessage(eventText);
            
            // Применяем изменения к вероятностям
            yourWinProbability += randIncident;
            oppWinProbability -= randIncident;
            
            // Корректируем границы вероятностей
            yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
            oppWinProbability = Math.max(0, Math.min(100, oppWinProbability));
            
            // Гарантируем, что сумма остается 100%
            const total = yourWinProbability + oppWinProbability;
            if (total !== 100) {
                const adjustment = 100 - total;
                yourWinProbability += adjustment / 2;
                oppWinProbability += adjustment / 2;
            }
            
            await sleep(2000);
        };
    }
    
    const probabilityDisplay = document.createElement('div');
    probabilityDisplay.textContent = `Вероятность победы '${gameState.yourTeamName}': ${Math.round(yourWinProbability)}%`;
    screenContent.appendChild(probabilityDisplay);
    
    const oppProbabilityDisplay = document.createElement('div');
    oppProbabilityDisplay.textContent = `Вероятность победы противника: ${Math.round(oppWinProbability)}%`;
    screenContent.appendChild(oppProbabilityDisplay);
    
    await sleep(2000);
    
    let yourGoals = 0;
    let opponentGoals = 0;
    
    const goalPhrases = {
        yourGoal: [
            "⚽ Гооол, ваша команда забила!",
            "⚽ Великолепный удар! Невероятный гол забивает ваша команда!",
            "⚽ Ваш нападающий отправляет мяч в сетку!",
            "⚽ Бомбардир не подвел! Гол!"
        ],
        yourMiss: [
            "Штанга! Ваш игрок чуть не забил.",
            "Мяч пролетел мимо ворот...",
            "Вратарь соперника парировал удар.",
            "Ваш игрок не смог переиграть защиту.",
            "Промах! Ваша команда упустила шанс."
        ],
        opponentGoal: [
            "❌ Обидный гол... Противник забивает.",
            "❌ Вратарь не справился, гол в ваши ворота.",
            "❌ Противник забил после ошибки защиты.",
            "❌ Ваша команда пропустила."
        ],
        opponentMiss: [
            "Противник чуть не забил!",
            "Ваш вратарь спас команду!",
            "Мяч пролетел мимо ворот соперника.",
            "Противник упустил шанс забить.",
            "Промах! Противник не смог реализовать момент."
        ]
    };
    
    for (let i = 0; i < 5; i++) {
        // Your team shoots
        if (Math.random() < yourWinProbability / 100) {
            yourGoals++;
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourGoal[Math.floor(Math.random() * goalPhrases.yourGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourMiss[Math.floor(Math.random() * goalPhrases.yourMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000);
        
        // Opponent shoots
        if (Math.random() < (oppWinProbability) / 100) {
            opponentGoals++;
            addMessage(`Противник: ${goalPhrases.opponentGoal[Math.floor(Math.random() * goalPhrases.opponentGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`Противник: ${goalPhrases.opponentMiss[Math.floor(Math.random() * goalPhrases.opponentMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000);
    }
    
    addMessage(`Итоговый счет: ${yourGoals} - ${opponentGoals}`);
    
    // Determine result
    let result;
    if (yourGoals > opponentGoals) {
        result = 'win';
        gameState.coins += 50;
        gameState.wins++;
        addMessage("Вы выиграли матч! +50🪙.");
    } else if (yourGoals === opponentGoals) {
        result = 'draw';
        gameState.coins += 20;
        gameState.draws++;
        addMessage("Ничья! +20🪙.");
    } else {
        result = 'lose';
        gameState.loses++;
        addMessage("Вы проиграли матч. Ничего не получено.");
    }
    
    if (gameState.postersBought) {
        const ratingBeforeReset = calculateTeamRating(gameState.team, gameState.tempBoost);
        gameState.tempBoost = 0;
        gameState.postersBought = false;
        const ratingAfterReset = calculateTeamRating(gameState.team);
        
        addMessage('Бонус от плакатов больше не действует');
        addMessage(`Рейтинг до сброса: ${ratingBeforeReset}`);
        addMessage(`Текущий рейтинг: ${ratingAfterReset}`);
    }

    addMessage(`Ваш баланс: ${gameState.coins}🪙.`);
    
    // Proceed to next match or playoff
    if (gameState.currentMatch < 2) {
        addAction(`Начать матч ${gameState.currentMatch + 2}`, () => startMatch(gameState.currentMatch + 1));
    } else {
        checkPlayoffQualification();
    }
}

async function checkPlayoffQualification() {
    const totalPoints = gameState.wins * 3 + gameState.draws;
    
    if (gameState.wins >= 2 || (gameState.wins === 1 && gameState.draws >= 1)) {
        addMessage(`Ваша команда '${gameState.yourTeamName}' набрала ${totalPoints} очков в группе! Вы вышли в плей-офф! Поздравляем!`);
        addAction('Начать плей-офф', startPlayoff);
    } else {
        addMessage("Вы не прошли в плей-офф. Турнир завершен.");
        addAction('Далее ➡️', endTournament);
    }
}

// Playoff functions
function startPlayoff() {
    gameState.inPlayoff = true;
    gameState.tempBoost = 0;
    gameState.postersBought = false;
    
    // Определяем соперников один раз при старте плей-офф
    const semifinalOpponents = ["Динамо", "ЦСКА", "Спартак"];
    const finalOpponents = ["Зенит", "Краснодар"];
    
    gameState.playoffOpponent = semifinalOpponents[Math.floor(Math.random() * semifinalOpponents.length)];
    gameState.finalOpponent = finalOpponents[Math.floor(Math.random() * finalOpponents.length)];
    
    showPlayoffScreen('Полуфинал');
}

function showPlayoffScreen(stage) {
    clearScreen();
    screenTitle.textContent = stage;
    
    // Используем заранее определенных соперников
    gameState.currentOpponent = stage === 'Полуфинал' 
        ? gameState.playoffOpponent 
        : gameState.finalOpponent;
    
    gameState.currentOpponentRating = Math.min(
        gameState.teamRatings[gameState.currentOpponent] + (stage === 'Полуфинал' ? 5 : 10),
        70
    );

    generateTransferMarket();
    
    const opponentInfo = document.createElement('div');
    opponentInfo.className = 'opponent-info';
    opponentInfo.textContent = `${stage}: Вы играете против команды '${gameState.currentOpponent}', рейтинг команды: ${gameState.currentOpponentRating}!`;
    screenContent.appendChild(opponentInfo);
    
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Ваш баланс: ${gameState.coins}🪙.`;
    screenContent.appendChild(coinsDisplay);
    
    displayTeam(gameState.team, gameState.tempBoost);
    
    addAction('🔄 1. Покупка/продажа игроков', showTradeScreen);
    addAction('👟 2. Футбольная тренировка (+2 или 3) - 30🪙', () => trainPlayer('football'));
    addAction('💪 3. Тренировка по физподготовке (+1 или 2) - 20🪙', () => trainPlayer('fitness'));
    addAction('🖼️ 4. Плакаты для болельщиков (+1 или 2 на один матч) - 10🪙', tryShowPostersScreen);
    addAction('📜 5. Посмотреть правила игры', displayRules);
    addAction('⚽ 6. Начать матч', () => playPlayoffMatch(stage));
}

async function playPlayoffMatch(stage) {
    gameState.currentOpponent = stage === 'Полуфинал' 
        ? gameState.playoffOpponent 
        : gameState.finalOpponent;

    clearScreen();
    screenTitle.textContent = `${stage} против ${gameState.currentOpponent}`;
    
    const yourRating = calculateTeamRating(gameState.team, gameState.tempBoost);
    const opponentRating = gameState.currentOpponentRating;
    
    const ratingDisplay = document.createElement('div');
    ratingDisplay.className = 'team-rating';
    ratingDisplay.textContent = `Рейтинг вашей команды '${gameState.yourTeamName}': ${yourRating}`;
    screenContent.appendChild(ratingDisplay);
    
    const opponentDisplay = document.createElement('div');
    opponentDisplay.className = 'opponent-info';
    opponentDisplay.textContent = `Рейтинг команды противника: ${opponentRating}`;
    screenContent.appendChild(opponentDisplay);
    
    // Calculate probabilities
    let yourWinProbability = 50 + (yourRating - opponentRating);
    yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
    let oppWinProbability = 100 - yourWinProbability;
    // Random event (50% chance)
    if (Math.random() < 0.5) {
        const randIncident = Math.floor(Math.random() * 7) - 5; // -5 to 5
        let eventText = '';
        
        if (randIncident >= 1 && randIncident <= 3) {
            // Положительные события
            const positiveEvents = [
                `Главный нападающий влюбился, у него невероятный эмоциональный подъем (+${2 * randIncident}% к шансу забить гол)`,
                `Тренер нашел идеальную тактику против соперника (+${2 * randIncident}% к шансу победы)`,
                `Капитан вашей команды пообещал пиво за победу (+${2 * randIncident}% к шансу победы)`
            ];
            eventText = positiveEvents[Math.floor(Math.random() * positiveEvents.length)];
        } else if (randIncident >= -3 && randIncident <= -1) {
            // Отрицательные события
            const negativeEvents = [
                `У нападающего умер хомячок, у него депрессия (${2 * randIncident}% к шансу забить гол)`,
                `Ключевой игрок поссорился с тренером (${2 * randIncident}% к шансу победы)`,
                `Центральный защитник в Теремке и отравился (${2 * randIncident}% к шансу победы)`
            ];
            eventText = negativeEvents[Math.floor(Math.random() * negativeEvents.length)];
        }

        if (eventText) {
            addMessage('⚡ Случайное событие!');
            addMessage(eventText);
            
            // Применяем изменения к вероятностям
            yourWinProbability += randIncident;
            oppWinProbability -= randIncident;
            
            // Корректируем границы вероятностей
            yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
            oppWinProbability = Math.max(0, Math.min(100, oppWinProbability));
            
            // Гарантируем, что сумма остается 100%
            const total = yourWinProbability + oppWinProbability;
            if (total !== 100) {
                const adjustment = 100 - total;
                yourWinProbability += adjustment / 2;
                oppWinProbability += adjustment / 2;
            }
            
            await sleep(2000);
        };
    }
    
    const probabilityDisplay = document.createElement('div');
    probabilityDisplay.textContent = `Вероятность победы '${gameState.yourTeamName}': ${Math.round(yourWinProbability)}%`;
    screenContent.appendChild(probabilityDisplay);
    
    const oppProbabilityDisplay = document.createElement('div');
    oppProbabilityDisplay.textContent = `Вероятность победы противника: ${Math.round(oppWinProbability)}%`;
    screenContent.appendChild(oppProbabilityDisplay);
    
    await sleep(2000);
    
    let yourGoals = 0;
    let opponentGoals = 0;
    
    const goalPhrases = {
        yourGoal: [
            "⚽ Гооол, ваша команда забила!",
            "⚽ Великолепный удар! Невероятный гол забивает ваша команда!",
            "⚽ Ваш нападающий отправляет мяч в сетку!",
            "⚽ Бомбардир не подвел! Гол!"
        ],
        yourMiss: [
            "Штанга! Ваш игрок чуть не забил.",
            "Мяч пролетел мимо ворот...",
            "Вратарь соперника парировал удар.",
            "Ваш игрок не смог переиграть защиту.",
            "Промах! Ваша команда упустила шанс."
        ],
        opponentGoal: [
            "❌ Обидный гол... Противник забивает.",
            "❌ Вратарь не справился, гол в ваши ворота.",
            "❌ Противник забил после ошибки защиты.",
            "❌ Ваша команда пропустила."
        ],
        opponentMiss: [
            "Противник чуть не забил!",
            "Ваш вратарь спас команду!",
            "Мяч пролетел мимо ворот соперника.",
            "Противник упустил шанс забить.",
            "Промах! Противник не смог реализовать момент."
        ]
    };
    
    for (let i = 0; i < 5; i++) {
        // Your team shoots
        if (Math.random() < yourWinProbability / 100) {
            yourGoals++;
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourGoal[Math.floor(Math.random() * goalPhrases.yourGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourMiss[Math.floor(Math.random() * goalPhrases.yourMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000);
        
        // Opponent shoots
        if (Math.random() < (oppWinProbability) / 100) {
            opponentGoals++;
            addMessage(`Противник: ${goalPhrases.opponentGoal[Math.floor(Math.random() * goalPhrases.opponentGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`Противник: ${goalPhrases.opponentMiss[Math.floor(Math.random() * goalPhrases.opponentMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000);
    }
    
    addMessage(`Итоговый счет: ${yourGoals} - ${opponentGoals}`);
    
    // Determine result
    if (yourGoals > opponentGoals) {
        const reward = stage === 'Полуфинал' ? 100 : 150;
        gameState.coins += reward;
        gameState.wins++;
        if (stage == 'Полуфинал') {
            gameState.prefinal_res = 1;
        }
        else if (stage == 'Финал') {
            gameState.final_res = 1;
        }
        addMessage(`Вы выиграли ${stage.toLowerCase()}! +${reward}🪙.`);
        
        if (stage === 'Полуфинал') {
            addAction('Начать финал', () => {
                showPlayoffScreen('Финал');
            });
        } else {
            addMessage("🏆 Вы выиграли финал! Вы чемпион! 🏆");
            addAction('Далее ➡️', () => {
                endTournament();
            });
        }
    } 
    else if (yourGoals === opponentGoals) {
        addMessage(`${stage} завершился вничью! Начинается серия пенальти.`);
        await sleep(3000);
        
        const penaltyResult = await penaltyShootout();
        if (penaltyResult === 'win') {
            const reward = stage === 'Полуфинал' ? 100 : 150;
            gameState.coins += reward;
            gameState.wins++;
            addMessage(`Вы выиграли в серии пенальти! +${reward}🪙.`);
            
            if (stage === 'Полуфинал') {
                addAction('Начать финал', () => {
                    gameState.prefinal_res = 1;
                    showPlayoffScreen('Финал');
                });
            } else {
                addMessage("🏆 Вы выиграли финал! Вы чемпион! 🏆");
                gameState.final_res = 1;
                addAction('Далее ➡️', () => {
                    endTournament();
                });
            }
        } else {
            addMessage("Вы проиграли в серии пенальти.");
            gameState.loses++;
            addAction('Далее ➡️', () => {
                endTournament();
            });
        }
    } 
    else {
        addMessage(`Вы проиграли ${stage.toLowerCase()}. Турнир завершен.`);
        gameState.loses++;
        addAction('Далее ➡️', () => {
            endTournament();
        });
    }
    // Reset posters boost
    if (gameState.postersBought) {
        gameState.tempBoost = 0;
        gameState.postersBought = false;
        addMessage('Бонус от плакатов закончился.');
    }
}

async function penaltyShootout() {
    addMessage("\n=== Серия пенальти! ===");
    let yourPenaltyGoals = 0;
    let opponentPenaltyGoals = 0;

    // Первые 3 удара
    for (let i = 0; i < 3; i++) {
        // Ваша команда бьет
        if (Math.random() < 0.7) {  // 70% шанс забить пенальти
            yourPenaltyGoals++;
            addMessage("Ваш игрок забил пенальти!");
        } else {
            addMessage("Ваш игрок не смог забить пенальти...");
        }
        await sleep(2000);

        // Противник бьет
        if (Math.random() < 0.7) {  // 70% шанс забить пенальти
            opponentPenaltyGoals++;
            addMessage("Противник забил пенальти!");
        } else {
            addMessage("Противник не смог забить пенальти!");
        }
        await sleep(2000);
    }

    addMessage(`\nИтоговый счет после 3 ударов: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);

    // Если счет равный, продолжаем до первого различия
    while (yourPenaltyGoals === opponentPenaltyGoals) {
        addMessage("\nСчет равный. Дополнительный удар!");

        // Ваша команда бьет
        if (Math.random() < 0.7) {
            yourPenaltyGoals++;
            addMessage("Ваш игрок забил пенальти!");
        } else {
            addMessage("Ваш игрок не смог забить пенальти...");
        }
        await sleep(2000);

        // Противник бьет
        if (Math.random() < 0.7) {
            opponentPenaltyGoals++;
            addMessage("Противник забил пенальти!");
        } else {
            addMessage("Противник не смог забить пенальти!");
        }
        await sleep(2000);

        addMessage(`Текущий счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
    }

    // Определение победителя
    if (yourPenaltyGoals > opponentPenaltyGoals) {
        return 'win';
    } else {
        return 'lose';
    }
}

function endTournament() {
    clearScreen();
    
    // Получаем DOM-элементы
    const screenTitle = document.getElementById('screen-title');
    const screenContent = document.getElementById('screen-content');
    
    let tournamentResult = "";
    // Проверяем, находится ли команда в плейофф
    if (gameState.inPlayoff) {
        if (gameState.final_res == 1) {
            tournamentResult = "🏆 Победитель турнира";
            } 
        else if (gameState.final_res == 0 && gameState.prefinal_res == 1) {
            tournamentResult = "🥈 Финалист";
        }
        else {
            tournamentResult = "🔹 Полуфиналист";
        }
        
    } else {
        // Если не в плейофф, значит групповой этап
        tournamentResult = "🔸 Групповой этап";
    }

    screenTitle.textContent = 'Турнир завершен';

    const resultDisplay = document.createElement('div');
    resultDisplay.className = 'tournament-result';
    resultDisplay.innerHTML = `
        <h2>${tournamentResult}</h2>
        
        <div class="res">
            <div class="res-item win">
                <div class="res-value">${gameState.wins}</div>
                <div class="res-label">Побед</div>
            </div>
            <div class="res-item draw">
                <div class="res-value">${gameState.draws}</div>
                <div class="res-label">Ничьих</div>
            </div>
            <div class="res-item lose">
                <div class="res-value">${gameState.loses}</div>
                <div class="res-label">Поражений</div>
            </div>
        </div>
    `;

    screenContent.appendChild(resultDisplay);
    
    // Добавляем отображение монет
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.textContent = `Финальный баланс: ${gameState.coins}🪙`;
    screenContent.appendChild(coinsDisplay);

    displayTeam(gameState.team);
    
    // Добавляем кнопку
    const actionButton = document.createElement('button');
    actionButton.className = 'action-btn';
    actionButton.textContent = 'Начать новую игру';
    actionButton.onclick = startGame;
    screenContent.appendChild(actionButton);
}

startGame();