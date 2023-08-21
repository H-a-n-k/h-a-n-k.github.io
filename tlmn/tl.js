var deck = [];
var hands = [];
var players = [];
var playingCards = [];
var iSelectedCards = [];
var nPlayer, nRemainPlayer, currPlayer, lastPlayer, nKill;
var selectedType, selectedVal, lastType, lastValue;
var startingPoint, bettingPoint, firstTurn, winAll;

const cardGroup = ["n/a", "single", "pair", "triple", "quadruple", "n/a", "tri-pair", "n/a", "quad-pair", "n/a", "quin-pair", "straight", "six-pair", "straight"];
const testMode = false;
const allowNegativePoint = true;

var handEl, tableEl, rankEls, statusEls, resultEl, popUpEl;
var playBtn, skipBtn, continueBtn, restartBtn;

$(document).ready(function () {
    //get params
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    nPlayer = parseInt(urlParams.get('no-player'));

    console.log(nPlayer);
    if (!Number.isInteger(nPlayer) || nPlayer < 2 || nPlayer > 4) nPlayer = 4;
    console.log(nPlayer);
    startingPoint = 1000;
    bettingPoint = 1000;
    firstTurn = true;
    for (let i = 0; i < nPlayer; i++) players.push(new Player("player " + i, "imgs/avatars/default-avatar-" + i + ".png", startingPoint, 13));

    handEl = $("#player #hand")[0];
    playBtn = $("#player .btns .play");
    tableEl = $("#table .cards");
    skipBtn = $("#player .btns .skip");
    resultEl = $("#popup .result");
    popUpEl = $("#popup");
    continueBtn = $("#popup .continue");
    restartBtn = $("#popup .restart");

    startRound();
    let firstPlayer;
    for (let i = 0; i < hands.length; i++) {
        if (hands[i].findIndex(x => x.value == 1) != -1) {
            firstPlayer = i;
            break;
        }
    }
    var timeOut = 10;
    if(firstPlayer) while (currPlayer != firstPlayer && timeOut--) switchPlayer();

    //events
    $(skipBtn).click(skipTurn);
    $(playBtn).click(playCard);
    $(continueBtn).click(continueGame);
    $(restartBtn).click(restartGame);
});

function getDeck() { 
    deck = StandardCard.create52pack();
    for (let card of deck) { 
        card.value = (card.rank > 2) ? (card.rank - 3) * 4 : (card.rank + 10) * 4;
        card.value += card.suit;
    }
}

function sortHand(hand) {
    hand.sort(function (a, b) { return a.value - b.value });
}

function startRound() { 
    hands = [];
    for (let x of players) {
        x.result = 0;
        x.pointChanges = 0;
        x.active = true;
    }

    nRemainPlayer = nPlayer;
    nKill = 0;
    currPlayer = 0;
    lastPlayer = currPlayer;
    winAll = false;
    resetTurn();

    //create the 52-card deck
    getDeck();
    displayPlayers();
    statusEls = $(".player .status");
    rankEls = $(".player .rank");

    //shuffle deck
    ManageCard.shuffle(deck);

    //deal cards to 4 players
    for (let i = 0; i < nPlayer; i++) hands.push([]);
    ManageCard.deal(deck, hands, 13);

    //sort cart
    for (let x of hands) sortHand(x);

    // cheat code for testing
    // var rankName = ["", "Ace"];
    // for (let i = 2; i <= 10; i++) rankName.push(i.toString());
    // rankName = rankName.concat(["Jack", "Queen", "King"]);
    // const suitName = ["", "Spades", "Clubs", "Diamonds", "Hearts"];
    // for (let rank = 2; rank <= 2; rank++) {
    //     for (let suit = 1; suit <= 4; suit++) {
    //         var val = (rank > 2) ? (rank - 3) * 4 : (rank + 10) * 4;
    //         val += suit;
    //         var name = rankName[rank] + "_of_" + suitName[suit];
    //         hands[0].push(new StandardCard(name, "", `imgs/cards/${name.toLowerCase()}.png`, rank, suit, val));
    //         hands[0].splice(0, 1);
    //     }
    // }
    // for (let rank = 4; rank <= 4; rank++) {
    //     for (let suit = 1; suit <= 4; suit++) {
    //         var val = (rank > 2) ? (rank - 3) * 4 : (rank + 10) * 4;
    //         val += suit;
    //         var name = rankName[rank] + "_of_" + suitName[suit];
    //         hands[1].push(new StandardCard(name, "", `imgs/cards/${name.toLowerCase()}.png`, rank, suit, val));
    //         hands[1].splice(0, 1);
    //     }
    // }
    

    //display
    ManageCard.displayCards(handEl, hands[currPlayer]);
    addSelectingCardEvent();
}

var draggingEl;
function addSelectingCardEvent() { 
    var cards = $("#player #hand .card");
    $(cards).click(selectCard);
    $(cards).contextmenu((event) => { selectAll(event); return false; })
    //dragging card
    $(cards).mousedown((event) => {
        let target = event.currentTarget;
        $(target).addClass("dragging");
        draggingEl = target;
    });
    $(cards).mouseup((event) => {
        let target = event.currentTarget;

        if (draggingEl) { 
            if (draggingEl == target) return;
            let i = parseInt(draggingEl.dataset.ind), j = parseInt(target.dataset.ind);
            let x = hands[currPlayer].splice(i, 1); // 0 1 j 3 4 i 6
            if (i < j) j--;
            hands[currPlayer].splice(j + 1, 0, x[0]);
            ManageCard.displayCards(handEl, hands[currPlayer]);
            iSelectedCards = [];
            addSelectingCardEvent();
        }

        draggingEl = null;
    });
    $(document).mouseup(() => { $(draggingEl).removeClass("dragging"); draggingEl = null });
}

function selectCard() { 
    if ($(this).hasClass("selected")) iSelectedCards.push(this.dataset.ind);
    else { 
        var ind = iSelectedCards.indexOf(this.dataset.ind);
        if (ind > -1) iSelectedCards.splice(ind, 1);
    }
    changePlayBtnState();
}

function selectAll(event) { 
    iSelectedCards = [];
    if ($(event.currentTarget).hasClass("selected")) {
        $("#player #hand .card.selected").removeClass("selected");
    }
    else {
        $("#player #hand .card:not(.selected)").addClass("selected");
        for (let i = 0; i < hands[currPlayer].length; i++) iSelectedCards.push(i.toString());
    }
    changePlayBtnState();
}

function displayPlayers() {
    var htmltxt = "";
    for (let i = 1; i <= nPlayer - 1; i++) { 
        var j = i + currPlayer;
        j %= nPlayer;
        let res = players[j].result;

        htmltxt += `
            <div class="player">
                <div class="player-info"></div>
                <div class="status" ${res ? "style='display: none;'" : ""}>
                    <img src="imgs/cards/closed_card.png" alt="" class="small card">
                    <img src="imgs/status/cross.png" alt="" class="cross" ${players[j].active ? "style='display: none;'" : ""}>
                    <div class="count">
                        <div class="value"> </div>
                    </div>
                </div>
                ${res ? `<img src="imgs/status/rank-${res < nPlayer ? res : "last"}.png" alt="" class="rank">`:""}
            </div>
        `;
    }
    $("#other-players").html(htmltxt);

    var playerEls = $("#main .player-info");
    var countEls = $("#main .status .value");
    for (let i = 0; i < nPlayer; i++) {
        var j = i + currPlayer;
        j %= nPlayer;

        var x = players[j];
        htmltxt = `
            <img src="${x.img}" alt="avatar" class="avatar">
            <div class="name">${x.name}</div>
            <div class="point">${x.point}</div>
        `;
        $(playerEls[i]).html(htmltxt);
        $(countEls[i - 1]).html(x.cardCount);
    }
}

function findNextPlayer() { 
    let t = nPlayer + 1;
    var res = currPlayer;
    do {
        res++;
        if (res >= nPlayer) res = 0;
    } while (!players[res].active && --t);
    if (!t) { 
        resetTurn();
        currPlayer = lastPlayer;
        return findNextPlayer();
    }

    return res;
}

function switchPlayer() { 
    currPlayer = findNextPlayer();

    ManageCard.displayCards(handEl, hands[currPlayer]);
    addSelectingCardEvent();
    if (lastPlayer == currPlayer) resetTurn();
    displayPlayers();

    iSelectedCards = [];
    changePlayBtnState();
}

function skipTurn() { 
    if (!$(this).hasClass("active")) return;

    players[currPlayer].active = false;
    switchPlayer();
}

function playCard() { 
    if (!$(this).hasClass("active")) return;

    if (!testMode && !checkPlay()) { 
        if (!winAll) alert("invalid play");
        return;
    }
    lastType = selectedType;
    lastValue = selectedVal;

    var remain = Array(hands[currPlayer].length).fill(true);
    var htmltxt = "";
    var cards = [];
    for (let x of iSelectedCards) { 
        let cardEl = handEl.querySelector(`.card-container[data-ind="${x}"`);
        $(cardEl).hide();
        cards.push(hands[currPlayer][x]);
        remain[x] = false;
    }

    sortHand(cards);
    for (card of cards) { 
        htmltxt += `
            <div class="card-container">
                <img src="${card.img}" alt="" class="medium card">
            </div>
        `;
    }
    let newArr = [];
    playingCards = [];
    for (let x = 0; x < hands[currPlayer].length; x++)
        if (remain[x]) newArr.push(hands[currPlayer][x]);
        else playingCards.push(hands[currPlayer][x]);
    hands[currPlayer] = newArr;

    $(tableEl).html(htmltxt);
    players[currPlayer].cardCount -= iSelectedCards.length;
    if (!players[currPlayer].cardCount) { 
        var end = !playerFinish();
        if (end) return;
    }
    
    lastPlayer = currPlayer;

    switchPlayer();
    changeSkipBtnState();
}

function playerFinish() { // return true if the game continues

    //update data
    let rank = nPlayer - nKill - nRemainPlayer + 1; //
    players[currPlayer].result = rank;
    players[currPlayer].active = false;
    nRemainPlayer--;
    //check 3 of clubs
    if (playingCards.length == 1 && playingCards[0].value == 1) { 
        players[currPlayer].pointChanges += bettingPoint / 2;
    }

    //annouce result
    alert(players[currPlayer].name + " finished #" + rank);

    //kill other player
    if (nRemainPlayer == nPlayer - 1) {
        //alert("full");//
        for (let i = 0; i < nPlayer; i++) {
            let p = players[i];
            if (p.cardCount == 13) {
                //alert("kill");//
                alert(`player ${p.name} died`);
                nKill++;
                p.active = false;
                p.result = nPlayer;
                nRemainPlayer--;

                var fine = checkTwos(hands[i]);
                hands[i] = [];
                players[currPlayer].pointChanges += fine;
                p.pointChanges -= fine;
            }
        }
    }

    // check if game continue
    if (nRemainPlayer <= 1) {
        endGame();
        return false;
    }


    //if the next player is the only one active, they get the turn 
    var nactive = 0;
    for (let x of players) if (x.active) nactive++;
    var next = currPlayer;
    if (nactive == 1) {
        do {
            next = (next + 1) % nPlayer;
        } while (players[next].result);
        if (players[next].active) resetTurn();
    }

    $(statusEls[currPlayer]).hide();
    $(rankEls[currPlayer]).attr("src", `imgs/status/rank-${rank}.png`);
    $(rankEls[currPlayer]).show();
    return true;
}

function getGroup(cards) { 
    var n = cards.length;
    if (n == 0) return { "type": cardGroup[0] };
    if (n == 1) return { "type": cardGroup[1], "value": cards[0].value };
    var sixPairs=true, straight = true, pStraight = true, count = Array(15).fill(0), max = -1;
    for (let x of cards) { 
        count[x.rank]++;
        max = Math.max(max, x.value);
    }
    count[14] = count[1]; //Ace = 14;

    if (count[2]) { 
        if (count[2] == n) return { "type": cardGroup[n], "value": max };
        else { 
            straight = false;
            pStraight = false;
        }
    }

    var x = count[3];
    var start = false, end = false;
    for (let i = 3; i < 15; i++) {
        if (count[i] == n) return { "type": cardGroup[n], "value": max };
        if (count[i]) {
            start = true;
            if (end) { 
                straight = false;
                pStraight = false;
            }

            if (count[i] == 1) pStraight = false;
            else straight = false;
        } else { 
            if (start) end = true;
            continue;
        }

        if (count[i] != 2) sixPairs = false;
        x = count[i];
    }
    if (pStraight || (sixPairs && n == 12)) return { "type": cardGroup[n], "value": max };
    if (straight && n > 2) return { "type": cardGroup[11], "value": max };

    return { "type": cardGroup[0] };
}

function checkPlay() {
    var cards = [];

    for (let x of iSelectedCards) cards.push(hands[currPlayer][x]);
    var grp = getGroup(cards);
    var type = grp.type, value = grp.value;
    selectedType = type;
    selectedVal = value;
    var playingType = lastType;
    var playingValue = lastValue;
    if ((type == cardGroup[4] && value == 52) || type == cardGroup[10] || type == cardGroup[12]) {
        if (nRemainPlayer == nPlayer) { 
            alert("easy game");
            winAll = true;
            players[currPlayer].result = 1;
            firstTurn = false;
            endGame();
            return false;
        }
    }

    //check first turn
    //bug: dưới 4 người chưa chắc có 3 bích
    if (firstTurn) {
        let flag = false;
        flag = true;//
        for (let i = 0; i < iSelectedCards.length; i++) {
            let ind = iSelectedCards[i];
            if (hands[currPlayer][ind].value == 1) { flag = true; break; }
        }
        if (!flag) {
            alert("first play needs to include Three of Clubs");
            return false;
        }
        firstTurn = false;
    }

    if (type == cardGroup[0]) return false; //not qualified
    if (!playingValue) return true; //no comparision

    //sp cases (ignore value)
    if (playingCards[0].rank == 2) { //two
        let flag = false;
        switch (playingCards.length) {
            case 1: if (type == cardGroup[4] || type == cardGroup[6] || type == cardGroup[8]) flag = true;
            case 2: if (type == cardGroup[4] || type == cardGroup[8]) flag = true;
            default: break;
        }
        if (flag) { 
            if (!players[lastPlayer].result) { 
                let fine = 0;
                for (let x of playingCards) {
                    if (x.value > 50) fine += bettingPoint;
                    else if (x.value > 48) fine += bettingPoint / 2;
                }

                players[currPlayer].pointChanges += fine;
                players[lastPlayer].pointChanges -= fine;
            }
            return true;
        }
    }
    if (playingType == cardGroup[6] && (type == cardGroup[4] || type == cardGroup[8])) return true; //3pr
    if (playingType == cardGroup[4] && type == cardGroup[8]) return true; //4 of a kind

    if (playingValue > value) return false; //fail comparision
    if (playingType == type && (type != cardGroup[11] || playingCards.length == iSelectedCards.length)) return true; //pass comparision
    

    return false; //this shouldnt happen
}

function changePlayBtnState() { 
    if (iSelectedCards.length) $(playBtn).addClass("active");
    else $(playBtn).removeClass("active");
}

function changeSkipBtnState() { 
    if (playingCards.length) $(skipBtn).addClass("active");
    else $(skipBtn).removeClass("active");
}

function resetTurn() { 
    for (let x of players) if (!x.result) x.active = true;
    playingCards = [];
    iSelectedCards = [];
    lastType = "";
    lastValue = 0;
    $(tableEl).html("");
    changeSkipBtnState();
}

function checkTwos(hand) { 
    var fine = 0;
    for (let x of hand) { 
        if (x.value > 50) fine += bettingPoint;
        else if (x.value > 48) fine += bettingPoint / 2;
    }

    return fine;
}


function endGame() { 
    alert("game ended");
    for (let x of players) if (!x.result) x.result = nPlayer - nKill;

    // check twos
    if (!winAll) { 
        for (let i = 0; i < nPlayer; i++) {
            if (players[i].result == nPlayer) {
                let fine = checkTwos(hands[i]);
                players[i].pointChanges -= fine;

                let iPrevPlayer = (i && players[i - 1].result == players[i].result - 1) ? i - 1 : 0;
                players[iPrevPlayer].pointChanges += fine;
            }
        }
    }

    // sort players by result
    players.sort((a, b) => a.result - b.result);

    // distribute the points + reset status;
    var point = bettingPoint;
    for (let x of players) { //1 2 3 4
        x.cardCount = 13;

        let j = x.result;
        let mid = (nPlayer + 1) / 2;
        if (j < mid) x.pointChanges += point / Math.pow(2, j - 1); 
        if (j > mid) x.pointChanges -= point / Math.pow(2, nPlayer - j);
        x.pointChanges = Math.floor(x.pointChanges);
        x.point += x.pointChanges;
    }
    if (winAll && nPlayer > 2) {
        let extra = bettingPoint * (nPlayer - 2)
        players[0].pointChanges += extra;
        players[0].point += extra;
    }
    if (nKill > 1) { 
        let extra = bettingPoint * (nKill - 1);
        players[0].pointChanges += extra;
        players[0].point += extra;
    }
    // show the result
    // option to start new round
    displayResult();

}

function displayResult() {
    let htmltxt = "";
    for (let p of players) {
        let pt = p.pointChanges;
        htmltxt += `
            <div class="player">
                <div class="rank">#${p.result}</div>
                <div class="info">
                    <div class="name">${p.name}</div>
                    <div class="point-info">
                        <div class="total point">${p.point}</div>
                        <div class="change ${pt >= 0 ? `">(+${pt}` : `down">(${pt}`})</div>
                    </div>
                </div>
                <img src="${p.img}" alt="" class="avatar">
            </div>                  
        `;
    }
    $(popUpEl).show();
    $(resultEl).html(htmltxt);
}

function continueGame() { 
    // eliminate players
    if (!allowNegativePoint) {
        let newArr = [];
        for (let x of players) if (x.point > 0) newArr.push(x);
        players = newArr;
        nPlayer = newArr.length;
    }

    //choose first player
    let firstPlayer = players.findIndex(x => x.result == 1);
    if (firstPlayer > 0) {
        let newArr = [];
        for (let i = 0; i < players.length; i++) {
            let j = (i + firstPlayer) % nPlayer;
            newArr.push(players[j]);
        }
        players = newArr;
    }

    $(popUpEl).hide();
    startRound();
}

function restartGame() { 
    location.reload();
}

class Player{
    constructor(name,img,point, cardCount) { 
        this.name = name;
        this.img = img;
        this.point = point;
        this.cardCount = cardCount;
    }
}
// sua luat chat heo - cho cong don
// create game menu
    // include: number of players, players' info + (select avatar), starting point, betting point, allow minus?
// add clock
// add log