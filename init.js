'use strict';

const node = document.getElementById('app');

// Update the second argument to `Elm.Main.embed` with your selected API. See
// the Intro section of the technical assessment documentation for more
// information:
// https://technical-assessment.konicaminoltamarketplace.com
const app = Elm.Main.embed(node, {
    api: 'Client',
    hostname: '',
});

app.ports.startTimer.subscribe((int) => {
    setTimeout(() => {
        app.ports.timeout.send(int);
    }, 10000);
});

class Node {
    constructor(coordinate, next = null) {
        this.coordinate = coordinate;
        this.next = next;
    }
};

class LinkedList {
    constructor() {
        this.head = null;
        this.size = 0;
    }

    // Insert first node
    insertFirstNode(coordinate) {
        this.head = new Node(coordinate, this.head);
        this.size++;
    }

    // Insert last node
    insertLastNode(coordinate) {
        let node = new Node(coordinate);
        let current;

        // if empty, make head
        if (!this.head) {
            this.head = node;
        } else {
            current = this.head;

            while (current.next) {
                current = current.next;
            }

            current.next = node;
        }

        this.size++;
    }

    // Get at index
    getAt(index) {
        let current = this.head;
        let count = 0;

        while (current) {
            if (count === index) {
                // console.log(current.data);
                return current.coordinate;
            }
                count++;
                current = current.next;
        }

        return;
    }

    getFirstPathCoordinate() {
        return this.getAt(0);
    }

    getLastPathCoordinate() {
        return this.getAt(this.size - 1);
    }

    // Clear list
    clearList() {
        this.head = null;
        this.size = 0;
    }

    // Print list coordinate
    printListData() {
        let current = this.head;

        while(current) {
            console.log(current.coordinate);
            current = current.next
        }
    }
}

const state = {
    firstClick: true,   // first click
    startClickCoordinate: null,
    endClickCoordinate: null,
    turn: 0,
    path: new LinkedList(),

    get startOfPathCoordinate() {
        return this.path.getFirstPathCoordinate();
    },

    get endOfPathCoordinate() {
        return this.path.getLastPathCoordinate();
    },

    get player() {
        return (this.turn + 1) % 2 === 0 ? 2 : 1;
    },

    formResponseObj(msg) {
        let responseObj;
        switch (msg) {
            case 'INITIALIZE':
                responseObj = {
                    msg,
                    body: {
                        newLine: null,
                        heading: `Player ${this.player}`,
                        message: `Awaiting Player ${this.player}'s Move`
                    }
                };
                break;
            case 'VALID_START_NODE':
                responseObj = {
                    msg,
                    body: {
                        newLine: null,
                        heading: `Player ${this.player}`,
                        message: "Select a second node to complete the line."
                    }
                };
                break;
            case 'INVALID_START_NODE':
                responseObj = {
                    msg,
                    body: {
                        newLine: null,
                        heading: `Player ${this.player}`,
                        message: "Not a valid starting position."
                    }
                };
                break;
            case 'VALID_END_NODE':
                responseObj = {
                    msg,
                    body: {
                        newLine: {
                            start: this.startClickCoordinate,
                            end: this.endClickCoordinate,
                        },
                        heading: `Player ${this.player}`,
                        message: null
                    }
                };
                break;
            case 'INVALID_END_NODE':
                responseObj = {
                    msg,
                    body: {
                        newLine: null,
                        heading: `Player ${this.player}`,
                        message: "Invalid move. Try again"
                    }
                }
        };

        // console.log('responseObj=', responseObj)
        return responseObj;
    }
}

// returns a Boolean
const checkCoordinatesAreEqual = (coordinate1, coordinate2) => {
    const keys1 = Object.keys(coordinate1);

    return keys1.every((key1) => {
        return coordinate1[key1] === coordinate2[key1];
    })
};

// reset state after invalid second click
const resetStateToFirstClick = () => {
    if (state.turn === 0) {
        // remove first (and the only one) node in state.path
    }
    state.firstClick = true;
    state.startClickCoordinate = null;
    state.endClickCoordinate = null;
}

// proceed to next player's turn
const nextPlayerTurn = () => {
    if (state.turn === 0) {
        // if it is a first turn, we need to add both first and last nodes(coordinates) to path
        state.path.insertFirstNode(state.startClickCoordinate);
        state.path.insertLastNode(state.endClickCoordinate);
    } else if (checkCoordinatesAreEqual(state.startClickCoordinate, state.startOfPathCoordinate)) {
        // else if state.firstClickCoordinate is equal to state.startOfPathCoordinate, then we insert in the beginning of the path
        state.path.insertFirstNode(state.endClickCoordinate);
    } else {
        // otherwise, we insert at the end of the path
        state.path.insertLastNode(state.endClickCoordinate);
    }

    state.turn++;
    app.ports.response.send(state.formResponseObj('VALID_END_NODE'));
    state.firstClick = true;
}

const startGame = (msg) => {
    app.ports.response.send(state.formResponseObj('INITIALIZE'));
}

// first coordinate should be equal to either start or end of path coordinate
const checkFirstCoordinateIsValid = (coordinate) => {
    // if it is a first player's turn, then node is valid
    if (state.turn === 0) return true;
    return checkCoordinatesAreEqual(coordinate, state.startOfPathCoordinate) || checkCoordinatesAreEqual(coordinate, state.endOfPathCoordinate);
}

// checks if line is octilinear (horizontal, vertical, or 45 degree angle) (returns true/false)
const checkLineIsOctilinear = (coordinate1, coordinate2) => {
    // if slope is 1, 0 or undefined, line is octilinear
    if (coordinate1.x === coordinate2.x || coordinate1.y === coordinate2.y) {
        console.log('line is octilinear, hor or ver')
        return true;
    }
    const slope = Math.abs((coordinate1.x - coordinate2.x) / (coordinate1.y - coordinate2.y));
    if (slope === 1) {
        console.log('line is octilinear, slope 1')
        return true;
    }
}

// returns true if coordinate if valid, false otherwise
const checkSecondCoordinateIsValid = () => {
    // if user clicked on the same coordinate on his second click
    if (checkCoordinatesAreEqual(state.startClickCoordinate, state.endClickCoordinate)) {
        return false
    }
    if (checkLineIsOctilinear(state.startClickCoordinate, state.endClickCoordinate)) {
        return true;
    }
    return false;
}

// coordinate is in form {x: Number, y: Number}
const handleNodeClicked = (coordinate, msg) => {
    // check if it is a first click of a player
    if (state.firstClick) {
        state.firstClick = false;
        state.startClickCoordinate = coordinate;

        // check if the first clicked node is valid
        if (checkFirstCoordinateIsValid(coordinate)) {
            return app.ports.response.send(state.formResponseObj('VALID_START_NODE'));
        } else {
            console.log('invalid start mode')
            console.log('response INVALID START NODE =', state.formResponseObj('INVALID_START_NODE'))
            app.ports.response.send(state.formResponseObj('INVALID_START_NODE'));
            resetStateToFirstClick();
            return;
        }
    };

    // it is a second click of a player
    state.endClickCoordinate = coordinate;

    // check if the second clicked node is valid
    if (!checkSecondCoordinateIsValid()) {
        app.ports.response.send(state.formResponseObj('INVALID_END_NODE'));
        resetStateToFirstClick();
        return;
    }

    nextPlayerTurn();
}

app.ports.request.subscribe((message) => {
    message = JSON.parse(message);
    // console.log(message)
    // Parse the message to determine a response, then respond:
    if (message.msg === 'INITIALIZE') {
        startGame(message.msg);
    };

    if (message.msg === 'NODE_CLICKED') {
        handleNodeClicked(message.body, message.msg);
    }

    console.log('state=', state);
    // app.ports.response.send({ some: 'object' });
});
