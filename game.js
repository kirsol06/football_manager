// Игровые переменные
const gameState = {
    players: [],                    // Массив всех игроков в игре
    team: [],                       // Текущая команда игрока
    teamRatings: {},                // Рейтинги всех команд
    opponents: [],                  // Список соперников в турнире
    coins: 100,                     // Количество футкоинов у игрока
    postersBought: false,           // Флаг покупки плакатов
    yourTeamName: "",               // Название команды игрока
    wins: 0,                        // Количество побед
    draws: 0,                       // Количество ничьих
    loses: 0,                       // Количество поражений
    prefinal_res: 0,                // Результат полуфинала (1 - победа)
    final_res: 0,                   // Результат финала (1 - победа)
    currentMatch: 0,                // Текущий матч в турнире
    inPlayoff: false,               // Флаг участия в плей-офф
    currentOpponent: "",            // Текущий соперник
    currentOpponentRating: 0,       // Рейтинг текущего соперника
    tempBoost: 0,                   // Временный бонус к рейтингу
    playerPoster: null,             // Изображение плаката игрока
    playerPosterStadium: null,      // Изображение плаката игрока на стадионе
    currentTransferMarket: [],      // Текущий трансферный рынок
    playoffOpponent: "",            // Соперник в полуфинале
    finalOpponent: ""               // Соперник в финале
};

// DOM элементы
const screenTitle = document.getElementById('screen-title');       // Заголовок экрана
const screenContent = document.getElementById('screen-content');   // Основное содержимое
const screenActions = document.getElementById('screen-actions');   // Блок с кнопками действий
const screenMessages = document.getElementById('screen-messages'); // Блок сообщений

// Очищает экран (контент, действия и сообщения)
function clearScreen() {
    screenContent.innerHTML = '';
    screenActions.innerHTML = '';
    screenMessages.innerHTML = '';
}

// Добавляет сообщение в лог событий (с поддержкой HTML)
function addMessage(html) {
    const message = document.createElement('div');
    message.className = 'match-event';
    message.innerHTML = html; // Используем innerHTML 
    screenMessages.appendChild(message);
    screenMessages.scrollTop = screenMessages.scrollHeight;
}

// Добавляет кнопку действия (с поддержкой HTML)
function addAction(html, callback) {
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.innerHTML = html; // Используем innerHTML 
    button.addEventListener('click', callback);
    screenActions.appendChild(button);
}

// Добавляет поле ввода с кнопкой
function addInputAction(text, placeholder, callback) {
    const input = document.createElement('input');
    input.type = 'text'; 
    input.placeholder = placeholder; // Подсказка в поле ввода
    input.className = 'input-field';
    screenActions.appendChild(input);

    const button = document.createElement('button');
    button.className = 'action-btn';
    button.textContent = text; // Текст на кнопке
    button.addEventListener('click', () => callback(input.value)); // Обработка клика
    screenActions.appendChild(button);
}

// Добавляет выпадающий список игроков с кнопкой выбора
function addPlayerSelector(promptText, playersList, callback, buttonText = 'Выбрать') {
    const container = document.createElement('div');
    container.className = 'player-select-container';
    
    const select = document.createElement('select');
    select.className = 'player-select';
    
    // Добавляем заглавный элемент с подсказкой
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.innerHTML = promptText;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    // Заполняем список игроками
    playersList.forEach((player, index) => {
        const option = document.createElement('option');
        option.value = index;
        
        let optionText = `${index + 1}. ${player.name} `;
        optionText += `(${player.team}) `;
        optionText += `- ${player.pos} - ${player.rating}`;
        option.innerHTML = optionText;
        select.appendChild(option);
    });
    
    const button = document.createElement('button');
    button.className = 'action-btn';
    button.textContent = buttonText;
    
    button.addEventListener('click', () => {
        if (select.value === '') {
            addMessage('Пожалуйста, выберите игрока');
            return;
        }
        
        // Блокируем элементы после выбора
        select.disabled = true;
        button.textContent = 'Выбрано';
        button.classList.add('selected');
        
        // Вызываем callback с выбранным игроком
        callback(parseInt(select.value));
    });
    
    container.appendChild(select);
    container.appendChild(button);
    screenActions.appendChild(container);
}

// Задержка выполнения (для анимаций)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms)); // ms - количество милисекунд задержки
}

// Вычисляет базовый рейтинг команды (сумма рейтингов игроков)
function calculateBasicRating(players) {
    return players.reduce((sum, player) => sum + player.rating, 0);
}

// Вычисляет бонус за сыгранность (игроки из одной команды)
// Считается, как количество пар игроков из одной команды, за каждую пару +1 к сыгранности
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

// Вычисляет общий рейтинг команды (база + сыгранность + временный бонус)
function calculateTeamRating(players, tempBoost = 0) {
    const totalRating = calculateBasicRating(players);
    const teamwork = calculateTeamwork(players);
    return totalRating + teamwork + tempBoost;
}

// Отображает состав вашей команды и статистику
function displayTeam(team, tempBoost = 0) {
    // Создаем список игроков
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
    
    // Создаем блок статистики
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

    // Общий рейтинг
    const totalRatingDisplay = document.createElement('div');
    totalRatingDisplay.className = 'rating-display total-rating';
    totalRatingDisplay.innerHTML = `
        <span class="stat-icon">📊</span>
        <span class="stat-text">Общий рейтинг:</span>
        <span class="stat-value">${calculateTeamRating(team, tempBoost)}⭐</span>
    `;

    // Добавляем все элементы в контейнер статистики
    statsContainer.appendChild(basicRatingDisplay);
    statsContainer.appendChild(teamworkDisplay);
    statsContainer.appendChild(totalRatingDisplay);

    screenContent.appendChild(statsContainer);
}

// Отображает экран с правилами игры
function displayRules() {
    clearScreen();
    screenTitle.textContent = '📜 Правила игры';
    
    const rulesDiv = document.createElement('div');
    rulesDiv.className = 'rules-screen';
    
    // Список правил игры
    const rules = [
        "👥 <strong>Состав команды:</strong> В вашей команде 5 игроков: 2 нападающих ⚽, 2 защитника 🛡️ и 1 вратарь 🧤",
        "⭐ <strong>Рейтинг игроков:</strong> Игроки имеют рейтинг от 1 до 10 (можно повысить до 12 с помощью тренировок 📈)",
        "📊 <strong>Командный рейтинг:</strong> Сумма рейтингов + бонус за сыгранность (+1, если пара игроков из одной команды РПЛ 🏆)",
        "🏟️ <strong>Турнирная система:</strong> Сначала групповой этап (3 матча ⏱️), затем плей-офф, если вы набрали 4 очка ✅",
        `<img src="game_pictures/coin.png" class="team-logo"> <strong>Футкоины:</strong> За победы (+50) и ничьи (+20) получаете футкоины для улучшения команды 💸`,
        "🛒 <strong>Улучшения:</strong> Тратьте футкоины на: новых игроков 👥, тренировки 🏋️‍♂️ или плакаты 🖼️",
        "🔄 <strong>Покупка/продажа игроков:</strong> Чтобы купить нового игрока, нужно продать одного из своей команды (с той же позиции) ↔️",
        "💼 <strong>Комиссия:</strong> При покупке/продаже: комиссия 20 футкоинов + разница между ценами игроков 💰",
        "🏃‍♂️ <strong>Тренировки:</strong> Бывают: футбольные (+2/3 к рейтингу 👟) и физподготовка (+1/2 к рейтингу 💪)",
        "🖼️ <strong>Плакаты:</strong> Дают +1/2 к рейтингу на один матч + ваш рисунок для поддержки 🎨",
        "🎯 <strong>Цель игры:</strong> Заработать как можно больше футкоинов, побеждая в турнире! 💰🏆"
    ];
    
    // Добавляем правила на экран
    rules.forEach(rule => {
        const p = document.createElement('p');
        p.innerHTML = rule;
        rulesDiv.appendChild(p);
    });
    
    screenContent.appendChild(rulesDiv);
    addAction('Назад ⬅️', showMatchPreparationScreen);
}

// Формирует случайную команду из доступных игроков 
function formTeam(players) {
    // Фильтруем игроков по позициям
    const forwards = players.filter(player => player.pos === 'Нап');
    const defenders = players.filter(player => player.pos === 'Защ');
    const goalkeepers = players.filter(player => player.pos === 'Врт');

    const selectedForwards = [];
    const selectedDefenders = [];
    const selectedGoalkeeper = [];

    // Выбираем случайных нападающих без дубликатов
    while (selectedForwards.length < 2) {
        const player = forwards[Math.floor(Math.random() * forwards.length)];
        if (!selectedForwards.some(p => p.name === player.name && p.team === player.team)) {
            selectedForwards.push(player);
        }
    }

    // Выбираем случайных защитников без дубликатов
    while (selectedDefenders.length < 2) {
        const player = defenders[Math.floor(Math.random() * defenders.length)];
        if (!selectedDefenders.some(p => p.name === player.name && p.team === player.team)) {
            selectedDefenders.push(player);
        }
    }

    // Выбираем случайного вратаря
    selectedGoalkeeper.push(goalkeepers[Math.floor(Math.random() * goalkeepers.length)]);

    return [...selectedForwards, ...selectedDefenders, ...selectedGoalkeeper];
}

// Вычисляет рейтинги всех команд
function calculateTeamRatings(players) {
    const teams = {};
    // Группируем игроков по командам
    players.forEach(player => {
        if (!teams[player.team]) {
            teams[player.team] = [];
        }
        teams[player.team].push(player);
    });

    // Вычисляем рейтинг для каждой команды
    const teamRatings = {};
    for (const teamName in teams) {
        teamRatings[teamName] = calculateTeamRating(teams[teamName]);
    }

    return teamRatings;
}

// Выбирает случайных соперников для группового этапа
function selectOpponents(teamRatings) {
    const availableTeams = Object.keys(teamRatings);
    const opponents = [];
    
    // Выбираем 3 уникальных соперника
    while (opponents.length < 3 && opponents.length < availableTeams.length) {
        const randomTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
        if (!opponents.includes(randomTeam)) {
            opponents.push(randomTeam);
        }
    }
    
    return opponents;
}

// Начинает новую игру, сбрасывая все состояния
function startGame() {
    // Сбрасываем состояние игры
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

    // Отображаем стартовый экран
    screenTitle.textContent = 'Футбольный менеджер РПЛ';
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-screen';
    welcomeDiv.innerHTML = `
        <h2>⚽ Футбольный менеджер РПЛ ⚽</h2>
        <img src="game_pictures/football_manager_icon.png" 
             alt="Футбольное поле" style="welcome-screen img">
        <p>Создайте непобедимую команду и выиграйте чемпионат!</p>
    `;
    screenContent.appendChild(welcomeDiv);
    
    addAction('Начать карьеру менеджера', showRulesScreen);
}

// Показывает экран с правилами игры
function showRulesScreen() {
    clearScreen();
    screenTitle.textContent = '📜 Правила игры';
    
    const rulesDiv = document.createElement('div');
    rulesDiv.className = 'rules-screen';
    
    // Список правил игры
    const rules = [
        "👥 <strong>Состав команды:</strong> В вашей команде 5 игроков: 2 нападающих ⚽, 2 защитника 🛡️ и 1 вратарь 🧤",
        "⭐ <strong>Рейтинг игроков:</strong> Игроки имеют рейтинг от 1 до 10 (можно повысить до 12 с помощью тренировок 📈)",
        "📊 <strong>Командный рейтинг:</strong> Сумма рейтингов + бонус за сыгранность (+1, если пара игроков из одной команды РПЛ 🏆)",
        "🏟️ <strong>Турнирная система:</strong> Сначала групповой этап (3 матча ⏱️), затем плей-офф, если вы набрали 4 очка ✅",
        `<img src="game_pictures/coin.png" class="team-logo"> <strong>Футкоины:</strong> За победы (+50) и ничьи (+20) получаете футкоины для улучшения команды 💸`,
        "🛒 <strong>Улучшения:</strong> Тратьте футкоины на: новых игроков 👥, тренировки 🏋️‍♂️ или плакаты 🖼️",
        "🔄 <strong>Покупка/продажа игроков:</strong> Чтобы купить нового игрока, нужно продать одного из своей команды (с той же позиции) ↔️",
        "💼 <strong>Комиссия:</strong> При покупке/продаже: комиссия 20 футкоинов + разница между ценами игроков 💰",
        "🏃‍♂️ <strong>Тренировки:</strong> Бывают: футбольные (+2/3 к рейтингу 👟) и физподготовка (+1/2 к рейтингу 💪)",
        "🖼️ <strong>Плакаты:</strong> Дают +1/2 к рейтингу на один матч + ваш рисунок для поддержки 🎨",
        "🎯 <strong>Цель игры:</strong> Заработать как можно больше футкоинов, побеждая в турнире! 💰🏆"
    ];
    
    // Добавляем правила на экран
    rules.forEach(rule => {
        const p = document.createElement('p');
        p.innerHTML = rule;
        rulesDiv.appendChild(p);
    });
    
    screenContent.appendChild(rulesDiv);
    
    addAction('Далее ➡️', askForTeamName);
}

// Запрашивает у игрока название команды
function askForTeamName() {
    clearScreen();
    screenTitle.textContent = '🏷️ Название команды';
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'welcome-screen';
    infoDiv.innerHTML = `
        <p>Дайте имя вашей команде, которое будет прославлено в турнире!</p>
        <img src="game_pictures/teams_rpl.png" 
             alt="Футбольное поле" style="welcome-screen img">
    `;
    screenContent.appendChild(infoDiv);
    
    // Добавляем поле ввода для названия команды
    addInputAction('Создать команду', 'Введите название команды', (name) => {
        if (name.trim()) {
            gameState.yourTeamName = name.trim();
            loadPlayersAndFormTeam();
        } else {
            addMessage('Пожалуйста, введите название команды');
        }
    });
}

// Загружает игроков из JSON и формирует команду
function loadPlayersAndFormTeam() {
    clearScreen();
    screenTitle.textContent = 'Формирование команды';

    // Загружаем данные игроков из JSON-файла
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

// Показывает состав команды и список соперников
function showTeamAndOpponents() {
    clearScreen();
    screenTitle.textContent = 'Ваша команда и соперники';
    
    // Отображаем баланс игрока
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`;
    screenContent.appendChild(coinsDisplay);
    
    // Отображаем название команды
    const teamInfo = document.createElement('div');
    teamInfo.innerHTML = `<h3>Ваша команда "${gameState.yourTeamName}":</h3>`;
    screenContent.appendChild(teamInfo);
    
    // Отображаем состав команды
    displayTeam(gameState.team);
    
    // Выбираем соперников
    gameState.opponents = selectOpponents(gameState.teamRatings);
    
    // Отображаем список соперников
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
        const ratingText = document.createTextNode(` (Рейтинг: ${gameState.teamRatings[opponent]}⭐)`);
        p.appendChild(ratingText);
        
        opponentsList.appendChild(p);
    });
    
    screenContent.appendChild(opponentsList);
    addMessage('Команда сформирована, соперники определены!');
    
    // Добавляем кнопку для начала турнира
    addAction('Начать турнир', () => startMatch(0));
}

// Показывает экран ошибки при загрузке данных
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

// Начинает матч с указанным индексом
function startMatch(matchIndex) {
    gameState.currentMatch = matchIndex;
    gameState.currentOpponent = gameState.opponents[matchIndex];
    gameState.currentOpponentRating = gameState.teamRatings[gameState.currentOpponent];
    gameState.tempBoost = 0;
    gameState.postersBought = false;
    generateTransferMarket();
    showMatchPreparationScreen();
}

// Показывает экран подготовки к матчу
function showMatchPreparationScreen() {
    // Если мы в плей-офф, возвращаемся на экран плей-офф
    if (gameState.inPlayoff) {
        const stage = gameState.currentOpponent === "Зенит" || gameState.currentOpponent === "Краснодар" 
            ? "Финал" 
            : "Полуфинал";
        showPlayoffScreen(stage);
        return; 
    }

    // Иначе показываем стандартный экран подготовки к матчу группового этапа
    clearScreen();
    screenTitle.textContent = `Матч ${gameState.currentMatch + 1}`;

    // Отображаем баланс игрока
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">`;
    screenContent.appendChild(coinsDisplay);
    
    // Отображаем информацию о сопернике
    const opponentInfo = document.createElement('div');
    opponentInfo.className = 'opponent-info';
    opponentInfo.innerHTML = `
        Ваш противник: 
        <span>
            <img src="images_of_teams/${gameState.currentOpponent}.png" class="team-logo" alt="${gameState.currentOpponent}">
            ${gameState.currentOpponent}
        </span>
        (Рейтинг: ${gameState.currentOpponentRating}⭐)
        `;
    screenContent.appendChild(opponentInfo);
    
    // Отображаем состав команды
    const teamInfo = document.createElement('div');
    teamInfo.innerHTML = `<h3>Ваша команда "${gameState.yourTeamName}":</h3>`;
    screenContent.appendChild(teamInfo);
    displayTeam(gameState.team, gameState.tempBoost);
    
    // Добавляем кнопки действий (используем innerHTML для правильного отображения иконок)
    addAction('🔄 1. Покупка/продажа игроков', showTradeScreen);
    addAction(`👟 2. Футбольная тренировка (+2 или 3) - 30<img src="game_pictures/coin.png" class="team-logo">`, () => trainPlayer('football'));
    addAction(`💪 3. Тренировка по физподготовке (+1 или 2) - 20<img src="game_pictures/coin.png" class="team-logo">`, () => trainPlayer('fitness'));
    addAction(`🖼️ 4. Плакаты для болельщиков (+1 или 2 на один матч) - 10<img src="game_pictures/coin.png" class="team-logo">`, tryShowPostersScreen);
    addAction('📜 5. Посмотреть правила игры', displayRules);
    addAction('⚽ 6. Начать матч', playMatch);
}

// Показывает экран трансферного рынка
function showTradeScreen() {
    clearScreen();
    screenTitle.textContent = 'Трансферный рынок';
    
    // Отображаем баланс игрока
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`;
    screenContent.appendChild(coinsDisplay);
    
    // Отображаем текущий состав команды
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
            - ${player.pos_pic}${player.pos} - ⭐${player.rating} - ${player.rating * 10}<img src="game_pictures/coin.png" class="team-logo">
        `;
        teamList.appendChild(p);
    });
    screenContent.appendChild(teamList);
    
    // Отображаем доступных игроков на трансферном рынке
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
        // Группируем игроков по позициям
        const playersByPosition = {
            'Нап': [],
            'Защ': [],
            'Врт': []
        };
        
        gameState.currentTransferMarket.forEach(player => {
            playersByPosition[player.pos].push(player);
        });
        
        // Отображаем игроков по позициям
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
                        - ${player.pos_pic}${player.pos} - ⭐${player.rating} - ${player.rating * 10}<img src="game_pictures/coin.png" class="team-logo">
                    `;
                    availablePlayersList.appendChild(p);
                });
            }
        }
    }
    screenContent.appendChild(availablePlayersList);

    // Выбор игрока из выпадающего списка
    addPlayerSelector(
        '-- Выберите игрока для продажи --', 
        gameState.team, 
        (sellId) => showAvailablePlayersForTrade(sellId),
        'Выбрать',
    );
    
    addAction('Назад ⬅️', showMatchPreparationScreen);
}

// Генерирует новых игроков на трансферном рынке перед каждым новым матчем
function generateTransferMarket() {
    gameState.currentTransferMarket = [];
    
    // Определяем необходимые позиции (2 нападающих, 2 защитника, 1 вратарь)
    const positionsNeeded = ['Нап', 'Нап', 'Защ', 'Защ', 'Врт'];
    const usedPlayerIds = new Set(); // Для отслеживания уже выбранных игроков
    
    // Для каждой позиции выбираем случайных игроков
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

// Показывает доступных игроков для обмена на выбранную позицию
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
    
    // Отображаем баланс игрока
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`;
    screenContent.appendChild(coinsDisplay);
    
    // Отображаем заголовок с позицией
    const positionTitle = document.createElement('h3');
    positionTitle.textContent = `Доступные игроки на позицию ${soldPosition}:`;
    screenContent.appendChild(positionTitle);
    
    // Отображаем список доступных игроков
    availablePlayers.forEach((player, index) => {
        const p = document.createElement('p');
        p.className = 'player-item-transfer';
        p.innerHTML = `
            ${index + 1}. ${player.name} 
                (<img src="images_of_teams/${player.team}.png" class="team-logo">
                ${player.team})
            </span>
            - ${player.pos_pic}${player.pos} - ⭐${player.rating} - ${player.rating * 10}<img src="game_pictures/coin.png" class="team-logo">
        `;
        screenContent.appendChild(p);
    });
    
    // Выбор игрока из выпадающего списка
    addPlayerSelector(
        '-- Выберите игрока для покупки --',
        availablePlayers,
        (buyId) => completeTrade(sellId, availablePlayers[buyId]),
        'Купить игрока'
    );
    
    addAction('Назад ⬅️', showTradeScreen);
}

// Завершает сделку по обмену игроков
async function completeTrade(sellId, boughtPlayer) {
    const buttons = document.querySelectorAll('.action-btn');
    const buyButton = buttons[0];
    const cancelButton = buttons[1];

    // Блокируем кнопки во время сделки
    cancelButton.disabled = true;
    cancelButton.style.opacity = '0.3';
    cancelButton.style.cursor = 'not-allowed';

    // Меняем текст кнопки покупки
    buyButton.textContent = 'Готово';
    buyButton.onclick = async () => {
        buyButton.disabled = true;
        showMatchPreparationScreen();
    };

    // Получаем данные об игроках и рассчитываем стоимость сделки
    const soldPlayer = gameState.team[sellId]; 
    const price = boughtPlayer.rating * 10; // Цена покупаемого игрока
    const sellPrice = soldPlayer.rating * 10; // Цена продаваемого игрока
    const commission = 20; // Комиссия
    let totalCost = price - sellPrice + commission; // Общая стоимость
    
    // Убедимся, что стоимость не отрицательная
    totalCost = Math.max(0, totalCost);

    // Проверяем, хватает ли денег на сделку
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

        // 1. Удаляем купленного игрока из текущего рынка
        gameState.currentTransferMarket.splice(boughtPlayerIndex, 1);
        
        // 2. Добавляем проданного игрока на рынок
        gameState.currentTransferMarket.push(soldPlayer);
        
        // 3. Заменяем игрока в команде
        gameState.team.splice(sellId, 1, boughtPlayer);

        // Списание денег
        gameState.coins -= totalCost;

        // Добавляем сообщения о сделке
        addMessage(`Вы продали ${soldPlayer.name} и купили ${boughtPlayer.name}.`);
        addMessage(`Комиссия за сделку: ${commission}. Разница между ценами игроков: ${Math.abs(price - sellPrice)}`);
        addMessage(`Итоговая стоимость сделки: ${totalCost}<img src="game_pictures/coin.png" class="team-logo">`);
        addMessage(`Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`);
        addMessage(`📊 Новый общий рейтинг команды: ${calculateTeamRating(gameState.team, gameState.tempBoost)}⭐`);
    } else {
        addMessage(`Не хватает <img src="game_pictures/coin.png" class="team-logo"> для покупки! Нужно ${totalCost}<img src="game_pictures/coin.png" class="team-logo">, у вас ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`);
    }
}

// Показывает экран тренировки игроков
function trainPlayer(trainingType) {
    // Определяем стоимость тренировки
    const cost = trainingType === 'football' ? 30 : 20;
    
    // Проверяем баланс
    if (gameState.coins < cost) {
        addMessage(`Не хватает<img src="game_pictures/coin.png" class="team-logo">! Нужно ${cost}, у вас ${gameState.coins}.`);
        return;
    }
    
    clearScreen();
    // Устанавливаем заголовок в зависимости от типа тренировки
    screenTitle.textContent = trainingType === 'football' ? 'Футбольная тренировка' : 'Тренировка по физподготовке';
    
    // Отображаем баланс
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`;
    screenContent.appendChild(coinsDisplay);
    
    // Отображаем текущий состав команды
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
    
    // Выбор игрока из выпадающего списка
    const trainablePlayers = gameState.team.filter(p => p.rating < 12);
    if (trainablePlayers.length === 0) {
        addMessage('Все игроки достигли максимального уровня!');
    } else {
        addPlayerSelector(
            '-- Выберите игрока для тренировки --',
            gameState.team,
            (playerId) => completeTraining(trainingType, playerId),
            'Тренировать'
        );
    }
    
    addAction('Назад ⬅️', showMatchPreparationScreen);
}

// Завершает процесс тренировки игрока
async function completeTraining(trainingType, playerId) {
    const player = gameState.team[playerId];
    
    // Проверяем максимальный рейтинг
    if (player.rating >= 12) {
        addMessage(`Игрок ${player.name} уже достиг максимального рейтинга (12).`);
        return;
    }
    
    const cost = trainingType === 'football' ? 30 : 20;
    
    // Проверяем баланс
    if (gameState.coins < cost) {
        addMessage(`Не хватает <img src="game_pictures/coin.png" class="team-logo">! Нужно ${cost}<img src="game_pictures/coin.png" class="team-logo">, у вас ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`);
        return;
    }
    
    // Находим кнопки в DOM
    const buttons = document.querySelectorAll('.action-btn');
    const trainButton = buttons[0]; // Кнопка "Тренировать игрока"
    const cancelButton = buttons[1]; // Кнопка "Назад ⬅️"
    
    // Блокируем кнопки во время тренировки
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
    
    // Определяем увеличение рейтинга в зависимости от типа тренировки
    let increase;
    if (trainingType === 'football') {
        increase = Math.random() < 0.5 ? 2 : 3; // 50% на +2 или +3
    } else {
        increase = Math.random() < 0.5 ? 1 : 2; // 50% на +1 или +2
    }
    
    // Увеличиваем рейтинг (но не более 12)
    player.rating = Math.min(player.rating + increase, 12);
    const newTeamRating = calculateTeamRating(gameState.team, gameState.tempBoost);
    
    // Обработчик для кнопки "Показать результат"
    resultButton.onclick = () => {
        addMessage(`Списано: ${cost}<img src="game_pictures/coin.png" class="team-logo">`);
        addMessage(`Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">`);
        addMessage(`Игрок ${player.name} улучшил рейтинг на +${increase}`);
        addMessage(`Новый рейтинг: ${player.rating}`);
        addMessage(`📊 Новый общий рейтинг команды: ${newTeamRating}⭐`);
        
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
                ? 'Футбольная тренировка (+2 или 3) - 30<img src="game_pictures/coin.png" class="team-logo">' 
                : 'Тренировка по физподготовке (+1 или 2) - 20<img src="game_pictures/coin.png" class="team-logo">';
            
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

// Проверяет возможность покупки плакатов и показывает экран
function tryShowPostersScreen() {
    // Проверяем, покупались ли уже плакаты
    if (gameState.postersBought) {
        addMessage(`Вы уже купили плакаты для этого матча (+${gameState.tempBoost} к рейтингу)`);
        return;
    }
    
    // Проверяем наличие денег
    if (gameState.coins < 10) {
        addMessage(`Не хватает <img src="game_pictures/coin.png" class="team-logo">! Нужно 10, у вас ${gameState.coins}`);
        return;
    }
    
    // Если все проверки пройдены - показываем экран плакатов
    showPostersScreen();
}

// Показывает экран создания плакатов для болельщиков
function showPostersScreen() {
    clearScreen();
    screenTitle.textContent = 'Плакаты для болельщиков';
    
    // Инструкция для игрока
    const instructions = document.createElement('p');
    instructions.innerHTML = '<h4>Нарисуйте плакат для болельщиков (+1-2 к рейтингу на 1 матч)</h4>';
    screenContent.appendChild(instructions);
    
    // Создаем canvas для рисования
    const canvas = document.createElement('canvas');
    canvas.id = 'posterCanvas';
    canvas.width = 300;
    canvas.height = 200;
    canvas.style.border = '2px solid #000';
    canvas.style.margin = '10px auto';
    canvas.style.display = 'block';
    canvas.style.backgroundColor = '#fff';
    screenContent.appendChild(canvas);
    
    // Создаем панель инструментов для рисования
    const toolsDiv = document.createElement('div');
    toolsDiv.style.textAlign = 'center';
    
    // Палитра цветов
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = '#ff0000';
    
    // Размер кисти
    const brushSize = document.createElement('select');
    brushSize.innerHTML = `
        <option value="3">Тонкая кисть</option>
        <option value="7" selected>Средняя кисть</option>
        <option value="12">Толстая кисть</option>
    `;
    
    // Кнопка очистки
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Очистить';
    clearBtn.className = 'action-btn';
    
    // Добавляем инструменты на экран
    toolsDiv.appendChild(colorPicker);
    toolsDiv.appendChild(brushSize);
    toolsDiv.appendChild(clearBtn);
    screenContent.appendChild(toolsDiv);
    
    // Добавляем кнопки действий
    if (!gameState.postersBought) {
        addAction('Сохранить плакат (10<img src="game_pictures/coin.png" class="team-logo">)', () => {
            if (gameState.coins >= 10) {
                savePoster(canvas);
                showPosterConfirmation();
            } else {
                addMessage('Недостаточно <img src="game_pictures/coin.png" class="team-logo">!');
            }
        });
    }
    else {
        addMessage('Вы уже купили постеры!');
    }
    
    addAction('Назад ⬅️', showMatchPreparationScreen);
    
    // Инициализируем рисование на canvas
    initDrawing(canvas, colorPicker, brushSize, clearBtn);
}

// Инициализирует рисование на canvas
function initDrawing(canvas, colorPicker, brushSize, clearBtn) {
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    
    // Обработчики событий мыши
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Обработчик очистки canvas
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    
    // Начало рисования
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    // Процесс рисования
    function draw(e) {
        if (!isDrawing) return;
        
        // Получаем координаты курсора относительно canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Настраиваем стиль рисования
        ctx.lineWidth = brushSize.value;
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorPicker.value;
        
        // Рисуем линию
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    // Окончание рисования
    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }
}

// Сохраняет плакат и устанавливает временный бонус
function savePoster(canvas) {
    // Сохраняем оригинальное изображение плаката
    gameState.playerPoster = canvas.toDataURL();
    
    // Создаем чистую HTML-структуру без inline-стилей
    gameState.playerPosterStadium = `
        <div class="stadium-poster-container">
            <div class="stadium-poster" style="background-image: url('${gameState.playerPoster}')"></div>
        </div>
    `;
    
    // Определяем бонус
    gameState.tempBoost = Math.random() < 0.7 ? 1 : 2;
    gameState.postersBought = true;
    gameState.coins -= 10;
    
    showPosterConfirmation();
}

// Показывает экран подтверждения создания плаката
function showPosterConfirmation() {
    clearScreen();
    screenTitle.textContent = 'Плакат сохранен!';
    
    // Отображаем оригинальный плакат (без фона стадиона)
    const posterPreview = document.createElement('div');
    posterPreview.className = 'poster-preview-container';
    posterPreview.innerHTML = `
        <h4>Ваш плакат:</h4>
        <div class="poster-frame">
            <img src="${gameState.playerPoster}" class="poster">
        </div>
    `;
    screenContent.appendChild(posterPreview);
    
    // Отображаем информацию о бонусе
    const boostInfo = document.createElement('div');
    boostInfo.innerHTML = `
        <h4>Бонус к рейтингу: +${gameState.tempBoost}</h4>
        <h4>Был рейтинг: ${calculateTeamRating(gameState.team)}⭐</h4>
        <h4>Теперь рейтинг: ${calculateTeamRating(gameState.team, gameState.tempBoost)}⭐</h4>
        <h4>Действует только на следующий матч</h4>
    `;
    screenContent.appendChild(boostInfo);
    
    addAction('Далее ➡️', showMatchPreparationScreen);
}

// Симулирует матч между командой игрока и соперником
async function playMatch() {
    clearScreen();
    screenTitle.textContent = `Матч против ${gameState.currentOpponent}`;
    
    // Рассчитываем рейтинги команд
    const yourRating = calculateTeamRating(gameState.team, gameState.tempBoost);
    const opponentRating = gameState.currentOpponentRating;
    
    // Отображаем рейтинги
    const ratingDisplay = document.createElement('div');
    ratingDisplay.className = 'team-rating';
    ratingDisplay.textContent = `Рейтинг вашей команды '${gameState.yourTeamName}': ${yourRating}⭐`;
    screenContent.appendChild(ratingDisplay);
    
    const opponentDisplay = document.createElement('div');
    opponentDisplay.className = 'opponent-info';
    opponentDisplay.textContent = `Рейтинг команды ${gameState.currentOpponent}: ${opponentRating}⭐`;
    screenContent.appendChild(opponentDisplay);
    
    // Рассчитываем вероятности победы
    let yourWinProbability = 50 + (yourRating - opponentRating);
    yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
    let oppWinProbability = 100 - yourWinProbability;
    
    // Случайное событие (50% chance)
    if (Math.random() < 0.5) {
        const randIncident = Math.floor(Math.random() * 7) - 5; // -3 to 3
        let eventText = '';
        
        // Положительные события
        if (randIncident >= 1 && randIncident <= 3) {
            const positiveEvents = [
                `Главный нападающий влюбился, у него невероятный эмоциональный подъем (+${2 * randIncident}% к шансу забить гол)`,
                `Тренер нашел идеальную тактику против соперника (+${2 * randIncident}% к шансу победы)`,
                `Капитан вашей команды пообещал пиво за победу (+${2 * randIncident}% к шансу победы)`
            ];
            eventText = positiveEvents[Math.floor(Math.random() * positiveEvents.length)];
        } 
        // Отрицательные события
        else if (randIncident >= -3 && randIncident <= -1) {
            const negativeEvents = [
                `У нападающего умер хомячок, у него депрессия (${2 * randIncident}% к шансу забить гол)`,
                `Ключевой игрок поссорился с тренером (${2 * randIncident}% к шансу победы)`,
                `Центральный защитник отравился в Теремке (${2 * randIncident}% к шансу победы)`
            ];
            eventText = negativeEvents[Math.floor(Math.random() * negativeEvents.length)];
        }

        if (eventText) {
            addMessage('⚡ Случайное событие!');
            addMessage(eventText);
            
            // Корректируем вероятности
            yourWinProbability += randIncident;
            oppWinProbability -= randIncident;
            
            // Проверяем границы вероятностей
            yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
            oppWinProbability = Math.max(0, Math.min(100, oppWinProbability));
            
            // Корректируем сумму до 100%
            const total = yourWinProbability + oppWinProbability;
            if (total !== 100) {
                const adjustment = 100 - total;
                yourWinProbability += adjustment / 2;
                oppWinProbability += adjustment / 2;
            }
            
            await sleep(2000);
        };
    }
    
    // Отображаем вероятности
    const probabilityDisplay = document.createElement('div');
    probabilityDisplay.textContent = `Вероятность победы '${gameState.yourTeamName}': ${Math.round(yourWinProbability)}%`;
    screenContent.appendChild(probabilityDisplay);
    
    const oppProbabilityDisplay = document.createElement('div');
    oppProbabilityDisplay.textContent = `Вероятность победы ${gameState.currentOpponent}: ${Math.round(oppWinProbability)}%`;
    screenContent.appendChild(oppProbabilityDisplay);
    
    // Если есть плакат - отображаем его
    if (gameState.playerPosterStadium) {
    const posterContainer = document.createElement('div');
    posterContainer.className = 'match-poster-container';
    posterContainer.innerHTML = `
        <h3 class="poster-title">Поддержка болельщиков:</h3>
        <div>
            ${gameState.playerPosterStadium}
        </div>
    `;
    screenContent.appendChild(posterContainer);
    }

    await sleep(2000);
    
    // Симулируем голы
    let yourGoals = 0;
    let opponentGoals = 0;
    
    // Фразы для комментариев матча
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
    
    // Симулируем 5 атак для каждой команды
    for (let i = 0; i < 5; i++) {
        // Атака вашей команды
        if (Math.random() < yourWinProbability / 100) {
            yourGoals++;
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourGoal[Math.floor(Math.random() * goalPhrases.yourGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourMiss[Math.floor(Math.random() * goalPhrases.yourMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000);
        
        // Атака соперника
        if (Math.random() < (oppWinProbability) / 100) {
            opponentGoals++;
            addMessage(`${gameState.currentOpponent}: ${goalPhrases.opponentGoal[Math.floor(Math.random() * goalPhrases.opponentGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`${gameState.currentOpponent}: ${goalPhrases.opponentMiss[Math.floor(Math.random() * goalPhrases.opponentMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000);
    }
    
    // Отображаем итоговый счет
    addMessage(`Итоговый счет: ${yourGoals} - ${opponentGoals}`);
    
    // Определяем результат матча
    let result;
    if (yourGoals > opponentGoals) {
        result = 'win';
        gameState.coins += 50;
        gameState.wins++;
        addMessage(`Вы выиграли матч! +50<img src="game_pictures/coin.png" class="team-logo">.`);
    } else if (yourGoals === opponentGoals) {
        result = 'draw';
        gameState.coins += 20;
        gameState.draws++;
        addMessage(`Ничья! +20<img src="game_pictures/coin.png" class="team-logo">.`);
    } else {
        result = 'lose';
        gameState.loses++;
        addMessage("Вы проиграли матч. Ничего не получено.");
    }
    
    // Сбрасываем бонус от плакатов после матча
    if (gameState.postersBought) {
        const ratingBeforeReset = calculateTeamRating(gameState.team, gameState.tempBoost);
        gameState.tempBoost = 0;
        gameState.postersBought = false;
        gameState.playerPoster = null;
        gameState.playerPosterStadium = null;
        const ratingAfterReset = calculateTeamRating(gameState.team);
        
        addMessage('Бонус от плакатов больше не действует');
        addMessage(`Рейтинг до сброса: ${ratingBeforeReset}⭐`);
        addMessage(`Текущий рейтинг: ${ratingAfterReset}⭐`);
    }

    addMessage(`Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`);
    
    // Переходим к следующему матчу или проверяем выход в плей-офф
    if (gameState.currentMatch < 2) {
        addAction(`Начать матч ${gameState.currentMatch + 2}`, () => startMatch(gameState.currentMatch + 1));
    } else {
        checkPlayoffQualification();
    }
}

// Проверяет, прошел ли игрок в плей-офф
async function checkPlayoffQualification() {
    const totalPoints = gameState.wins * 3 + gameState.draws;
    
    // Условия выхода в плей-офф: 2 победы или 1 победа + 1 ничья
    if (gameState.wins >= 2 || (gameState.wins === 1 && gameState.draws >= 1)) {
        addMessage(`Ваша команда '${gameState.yourTeamName}' набрала ${totalPoints} очков в группе! Вы вышли в плей-офф! Поздравляем!`);
        addAction('Начать плей-офф', startPlayoff);
    } else {
        addMessage("Вы не прошли в плей-офф. Турнир завершен.");
        addAction('Далее ➡️', endTournament);
    }
}

// Начиет этап плей-офф, выбирая противников
function startPlayoff() {
    gameState.inPlayoff = true;
    gameState.tempBoost = 0;
    gameState.postersBought = false;
    
    // Определяем возможных соперников
    const semifinalOpponents = ["Динамо", "ЦСКА", "Спартак"];
    const finalOpponents = ["Зенит", "Краснодар"];
    
    // Выбираем случайных соперников
    gameState.playoffOpponent = semifinalOpponents[Math.floor(Math.random() * semifinalOpponents.length)];
    gameState.finalOpponent = finalOpponents[Math.floor(Math.random() * finalOpponents.length)];
    
    // Устанавливаем первого соперника (полуфинал)
    gameState.currentOpponent = gameState.playoffOpponent;
    
    // Начинаем матч плей-офф
    startPlayoffMatch();
}

// Начинает матч плей-офф, обновляет трансферный рынок
function startPlayoffMatch() {
    generateTransferMarket(); // Обновляем трансферный рынок
    
    // Определяем текущий этап плей-офф
    const stage = gameState.currentOpponent === gameState.finalOpponent 
        ? 'Финал' 
        : 'Полуфинал';
    
    showPlayoffScreen(stage);
}

//  Показывает экран подготовки к матчу плей-офф
function showPlayoffScreen(stage) {
    clearScreen();
    screenTitle.textContent = stage;
    
    // Устанавливаем текущего соперника в зависимости от этапа
    gameState.currentOpponent = stage === 'Полуфинал' 
        ? gameState.playoffOpponent 
        : gameState.finalOpponent;
    
    // Увеличиваем рейтинг соперника в плей-офф (но не более 70)
    gameState.currentOpponentRating = Math.min(
        gameState.teamRatings[gameState.currentOpponent] + (stage === 'Полуфинал' ? 5 : 10),
        70
    );
    
    // Отображаем информацию о сопернике
    const opponentInfo = document.createElement('div');
    opponentInfo.className = 'opponent-info';
    opponentInfo.textContent = `${stage}: Вы играете против команды '${gameState.currentOpponent}', рейтинг команды: ${gameState.currentOpponentRating}⭐!`;
    screenContent.appendChild(opponentInfo);
    
    // Отображаем баланс
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Ваш баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">.`;
    screenContent.appendChild(coinsDisplay);
    
    // Отображаем состав команды
    displayTeam(gameState.team, gameState.tempBoost);
    
    // Добавляем кнопки действий
    addAction('🔄 1. Покупка/продажа игроков', showTradeScreen);
    addAction('👟 2. Футбольная тренировка (+2 или 3) - 30<img src="game_pictures/coin.png" class="team-logo">', () => trainPlayer('football'));
    addAction('💪 3. Тренировка по физподготовке (+1 или 2) - 20<img src="game_pictures/coin.png" class="team-logo">', () => trainPlayer('fitness'));
    addAction('🖼️ 4. Плакаты для болельщиков (+1 или 2 на один матч) - 10<img src="game_pictures/coin.png" class="team-logo">', tryShowPostersScreen);
    addAction('📜 5. Посмотреть правила игры', displayRules);
    addAction('⚽ 6. Начать матч', () => playPlayoffMatch(stage));
}

// Симулирует матч плей-офф
async function playPlayoffMatch(stage) {
    // Устанавливаем текущего соперника
    gameState.currentOpponent = stage === 'Полуфинал' 
        ? gameState.playoffOpponent 
        : gameState.finalOpponent;

    clearScreen();
    // Устанавливаем заголовок с названием матча
    screenTitle.textContent = `${stage} против ${gameState.currentOpponent}`;

    // Рассчитываем рейтинги команд
    const yourRating = calculateTeamRating(gameState.team, gameState.tempBoost);
    const opponentRating = gameState.currentOpponentRating;
    
    // Отображаем рейтинг команды игрока
    const ratingDisplay = document.createElement('div');
    ratingDisplay.className = 'team-rating';
    ratingDisplay.textContent = `Рейтинг вашей команды '${gameState.yourTeamName}': ${yourRating}⭐`;
    screenContent.appendChild(ratingDisplay);
    
    // Отображаем рейтинг команды соперника
    const opponentDisplay = document.createElement('div');
    opponentDisplay.className = 'opponent-info';
    opponentDisplay.textContent = `Рейтинг команды ${gameState.currentOpponent}: ${opponentRating}⭐`;
    screenContent.appendChild(opponentDisplay);
    
    // Рассчитываем базовые вероятности победы (50% + разница рейтингов)
    let yourWinProbability = 50 + (yourRating - opponentRating);
    yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
    let oppWinProbability = 100 - yourWinProbability;
    
    // 50% шанс случайного события, влияющего на матч
    if (Math.random() < 0.5) {
        const randIncident = Math.floor(Math.random() * 7) - 5; // Случайное число от -3 до 3
        let eventText = '';
        
        // Положительные события (от +2% до +6%)
        if (randIncident >= 1 && randIncident <= 3) {
            const positiveEvents = [
                `Главный нападающий влюбился, у него невероятный эмоциональный подъем (+${2 * randIncident}% к шансу забить гол)`,
                `Тренер нашел идеальную тактику против соперника (+${2 * randIncident}% к шансу победы)`,
                `Капитан вашей команды пообещал пиво за победу (+${2 * randIncident}% к шансу победы)`
            ];
            eventText = positiveEvents[Math.floor(Math.random() * positiveEvents.length)];
        } 
        // Отрицательные события (от -6% до -2%)
        else if (randIncident >= -3 && randIncident <= -1) {
            const negativeEvents = [
                `У нападающего умер хомячок, у него депрессия (${2 * randIncident}% к шансу забить гол)`,
                `Ключевой игрок поссорился с тренером (${2 * randIncident}% к шансу победы)`,
                `Центральный защитник в Теремке и отравился (${2 * randIncident}% к шансу победы)`
            ];
            eventText = negativeEvents[Math.floor(Math.random() * negativeEvents.length)];
        }

        // Если событие сгенерировалось, применяем его эффект
        if (eventText) {
            addMessage('⚡ Случайное событие!');
            addMessage(eventText);
            
            // Корректируем вероятности
            yourWinProbability += randIncident;
            oppWinProbability -= randIncident;
            
            // Проверяем, чтобы вероятности оставались в границах 0-100%
            yourWinProbability = Math.max(0, Math.min(100, yourWinProbability));
            oppWinProbability = Math.max(0, Math.min(100, oppWinProbability));
            
            // Корректируем сумму вероятностей до 100%
            const total = yourWinProbability + oppWinProbability;
            if (total !== 100) {
                const adjustment = 100 - total;
                yourWinProbability += adjustment / 2;
                oppWinProbability += adjustment / 2;
            }
            
            await sleep(2000); // Пауза для чтения сообщения
        };
    }
    
    // Отображаем текущие вероятности победы
    const probabilityDisplay = document.createElement('div');
    probabilityDisplay.textContent = `Вероятность вашей победы '${gameState.yourTeamName}': ${Math.round(yourWinProbability)}%`;
    screenContent.appendChild(probabilityDisplay);
    
    const oppProbabilityDisplay = document.createElement('div');
    oppProbabilityDisplay.textContent = `Вероятность победы ${gameState.currentOpponent}: ${Math.round(oppWinProbability)}%`;
    screenContent.appendChild(oppProbabilityDisplay);
    
    // Если есть плакат - отображаем его
    if (gameState.playerPosterStadium) {
    const posterContainer = document.createElement('div');
    posterContainer.className = 'match-poster-container';
    posterContainer.innerHTML = `
        <h3 class="poster-title">Поддержка болельщиков:</h3>
        <div>
            ${gameState.playerPosterStadium}
        </div>
    `;
    screenContent.appendChild(posterContainer);
    }

    await sleep(2000); // Пауза перед началом матча
    
    // Счетчики голов
    let yourGoals = 0;
    let opponentGoals = 0;
    
    // База фраз для комментариев матча
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
    
    // Симулируем 5 атак для каждой команды
    for (let i = 0; i < 5; i++) {
        // Атака вашей команды
        if (Math.random() < yourWinProbability / 100) {
            yourGoals++;
            // Случайная фраза о голе
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourGoal[Math.floor(Math.random() * goalPhrases.yourGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            // Случайная фраза о промахе
            addMessage(`${gameState.yourTeamName}: ${goalPhrases.yourMiss[Math.floor(Math.random() * goalPhrases.yourMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000); // Пауза между атаками
        
        // Атака соперника
        if (Math.random() < (oppWinProbability) / 100) {
            opponentGoals++;
            addMessage(`${gameState.currentOpponent}: ${goalPhrases.opponentGoal[Math.floor(Math.random() * goalPhrases.opponentGoal.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        } else {
            addMessage(`${gameState.currentOpponent}: ${goalPhrases.opponentMiss[Math.floor(Math.random() * goalPhrases.opponentMiss.length)]} Счет: ${yourGoals} - ${opponentGoals}`);
        }
        
        await sleep(3000); // Пауза между атаками
    }
    
    // Показываем итоговый счет
    addMessage(`Итоговый счет: ${yourGoals} - ${opponentGoals}`);
    
    // Обрабатываем результат матча
    if (yourGoals > opponentGoals) {
        // Награда зависит от этапа плей-офф
        const reward = stage === 'Полуфинал' ? 100 : 150;
        gameState.coins += reward;
        gameState.wins++;
        
        // Записываем результат для статистики
        if (stage == 'Полуфинал') {
            gameState.prefinal_res = 1;
        }
        else if (stage == 'Финал') {
            gameState.final_res = 1;
        }
        
        addMessage(`Вы выиграли ${stage.toLowerCase()}! +${reward}<img src="game_pictures/coin.png" class="team-logo">.`);
        
        // Переход на следующий этап или завершение турнира
        if (stage === 'Полуфинал') {
            addAction('Начать финал', () => {
                gameState.currentOpponent = gameState.finalOpponent;
                startPlayoffMatch();
            });
        } else {
            addMessage("🏆 Вы выиграли финал! Вы чемпион! 🏆");
            addAction('Далее ➡️', () => {
                endTournament();
            });
        }
    } 
    // Если ничья - серия пенальти
    else if (yourGoals === opponentGoals) {
        addMessage(`${stage} завершился вничью! Начинается серия пенальти.`);
        await sleep(3000);
        
        const penaltyResult = await penaltyShootout();
        if (penaltyResult === 'win') {
            const reward = stage === 'Полуфинал' ? 100 : 150;
            gameState.coins += reward;
            gameState.wins++;
            addMessage(`Вы выиграли в серии пенальти! +${reward}<img src="game_pictures/coin.png" class="team-logo">.`);
            
            if (stage === 'Полуфинал') {
                addAction('Начать финал', () => {
                    gameState.prefinal_res = 1;
                    gameState.currentOpponent = gameState.finalOpponent;
                    startPlayoffMatch();
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
    // Проигрыш в основное время
    else {
        addMessage(`Вы проиграли ${stage.toLowerCase()}. Турнир завершен.`);
        gameState.loses++;
        addAction('Далее ➡️', () => {
            endTournament();
        });
    }
    
    // Сбрасываем бонус от плакатов после матча
    if (gameState.postersBought) {
        gameState.tempBoost = 0;
        gameState.postersBought = false;
        gameState.playerPoster = null;
        gameState.playerPosterStadium = null;
        addMessage('Бонус от плакатов закончился.');
    }
}

// Симулирует серию пенальти
async function penaltyShootout() {
    addMessage("\n=== Серия пенальти! ===");
    let yourPenaltyGoals = 0;
    let opponentPenaltyGoals = 0;
    await sleep(2000);

    // Первые 3 удара
    for (let i = 0; i < 3; i++) {
        // Ваша команда бьет (70% шанс забить)
        if (Math.random() < 0.7) {
            yourPenaltyGoals++;
            addMessage(`Ваш игрок забил пенальти! Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        } else {
            addMessage(`Ваш игрок не смог забить пенальти... Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        }
        await sleep(2000);

        // Противник бьет (70% шанс забить)
        if (Math.random() < 0.7) {
            opponentPenaltyGoals++;
            addMessage(`Противник забил пенальти! Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        } else {
            addMessage(`Противник не смог забить пенальти! Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        }
        await sleep(2000);
    }

    addMessage(`\nИтоговый счет после 3 ударов: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);

    // Дополнительные удары, если счет равен
    while (yourPenaltyGoals === opponentPenaltyGoals) {
        addMessage(`\nСчет равный. Дополнительный удар!`);
        await sleep(2000);
        // Ваша команда бьет
        if (Math.random() < 0.7) {
            yourPenaltyGoals++;
            addMessage(`Ваш игрок забил пенальти! Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        } else {
            addMessage(`Ваш игрок не смог забить пенальти... Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        }
        await sleep(2000);

        // Противник бьет
        if (Math.random() < 0.7) {
            opponentPenaltyGoals++;
            addMessage(`Противник забил пенальти! Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        } else {
            addMessage(`Противник не смог забить пенальти! Счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
        }
        await sleep(2000);

        addMessage(`Текущий счет: ${yourPenaltyGoals} - ${opponentPenaltyGoals}`);
    }

    // Определяем победителя
    if (yourPenaltyGoals > opponentPenaltyGoals) {
        return 'win';
    } else {
        return 'lose';
    }
}

// Показывает экран завершения турнира
function endTournament() {
    clearScreen();
    
    // Получаем DOM-элементы
    const screenTitle = document.getElementById('screen-title');
    const screenContent = document.getElementById('screen-content');
    
    // Определяем достижение игрока в турнире
    let tournamentResult = "";
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
        // Если не прошли в плей-офф
        tournamentResult = "🔸 Групповой этап";
    }

    screenTitle.textContent = 'Турнир завершен';

    // Создаем блок с результатами турнира
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
    
    // Отображаем финальный баланс
    const coinsDisplay = document.createElement('div');
    coinsDisplay.className = 'coins-display';
    coinsDisplay.innerHTML = `Финальный баланс: ${gameState.coins}<img src="game_pictures/coin.png" class="team-logo">`;
    screenContent.appendChild(coinsDisplay);

    // Показываем финальный состав команды
    displayTeam(gameState.team);
    
    // Добавляем кнопку для новой игры
    const actionButton = document.createElement('button');
    actionButton.className = 'action-btn';
    actionButton.textContent = 'Начать новую игру';
    actionButton.onclick = startGame;
    screenContent.appendChild(actionButton);
}

// Запускаем игру при загрузке
startGame();