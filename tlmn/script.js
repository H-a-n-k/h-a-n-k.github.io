
$(document).ready(function () {

});

class Card { 

    constructor(name, desc, img) {
        this.name = name;
        this.img = img;
        this.desc = desc;
    }
    
}

class StandardCard extends Card {
    constructor(name, desc, img, rank, suit, value) {
        super(name, desc, img);
        this.rank = rank;
        this.suit = suit;
        this.value = value;
    }

    static create52pack() {
        var rankName = ["", "Ace"];
        for (let i = 2; i <= 10; i++) rankName.push(i.toString());
        rankName = rankName.concat(["Jack", "Queen", "King"]);

        const suitName = ["", "Spades", "Clubs", "Diamonds", "Hearts"];

        var res = [];
        for (let rank = 1; rank <= 13; rank++) {
            for (let suit = 1; suit <= 4; suit++) {
                var val = (rank - 1) * 4 + suit;
                var name = rankName[rank] + "_of_" + suitName[suit];
                res.push(new StandardCard(name, "", `imgs/cards/${name.toLowerCase()}.png`, rank, suit, val));
            }
        }

        return res;
    }

    static create54pack() {
        var res = this.create52pack();
        res.push(new StandardCard("Black Joker", "not known", "imgs/cards/black_joker.png", 0, 1, -1));
        res.push(new StandardCard("Red Joker", "not known", "imgs/cards/red_joker.png", 0, 4, 53));

        return res;
    }
}

class ManageCard {
    static shuffle(deck) {
        var curr = deck.length;
        while (--curr) {
            var ind = Math.floor(Math.random() * curr);
            [deck[ind], deck[curr]] = [deck[curr], deck[ind]];
        }
    }

    static deal(deck, hands, xcard) {
        while (xcard--) {
            for (let x of hands) {
                if (!deck.length) return 0;
                x.push(deck[deck.length - 1]);
                deck.pop();
            }
        }
    }

    static displayCards(container, cards) {
        var htmltxt = "";
        var ind = 0;
        for (let x of cards) {
            htmltxt += `
                <div class="card-container">
                    <img src="${x.img}" alt="" class="card" draggable="false" data-ind='${ind++}'>
                </div>
            `;
        }

        container.innerHTML = htmltxt;

        var cards = container.querySelectorAll(".card");
        $(cards).click((event) => { $(event.currentTarget).toggleClass("selected") });
    }
}