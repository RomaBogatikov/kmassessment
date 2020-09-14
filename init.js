'use strict';

const FIELD_DIMENSIONS = 4;

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

// /////////////////////////////////////////
// //////////Do Segments Intersect?/////////
// /////////////////////////////////////////
// block of code from: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/

// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
const onSegment = (p, q, r) => {
    if (
        (q.x <= Math.max(p.x, r.x))
        && (q.x >= Math.min(p.x, r.x))
        && (q.y <= Math.max(p.y, r.y))
        && (q.y >= Math.min(p.y, r.y))
    ) {
        return true;
    }
    return false;
};

const orientation = (p, q, r) => {
    // to find the orientation of an ordered triplet (p,q,r)
    // function returns the following values:
    // 0 : Colinear points
    // 1 : Clockwise points
    // 2 : Counterclockwise

    // See https://www.geeksforgeeks.org/orientation-3-ordered-points/amp/
    // for details of below formula.

    const val = ((q.y - p.y) * (r.x - q.x)) - ((q.x - p.x) * (r.y - q.y));
    if (val > 0) {
        // Clockwise orientation
        return 1;
    } else if (val < 0) {
        // Counterclockwise orientation
        return 2;
    } else {
        // Colinear orientation
        return 0;
    }
};

// The main function that returns true if
// the line segment 'p1q1' and 'p2q2' intersect.
const doIntersect = (p1,q1,p2,q2) => {

    // Find the 4 orientations required for
    // the general and special cases
    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    // General case
    if ((o1 != o2) && (o3 != o4)) {
        return true;
    }

    // Special Cases

    // p1 , q1 and p2 are colinear and p2 lies on segment p1q1
    if ((o1 == 0) && onSegment(p1, p2, q1)) {
        return true;
    }

    // p1 , q1 and q2 are colinear and q2 lies on segment p1q1
    if ((o2 == 0) && onSegment(p1, q2, q1)) {
        return true;
    }

    // p2 , q2 and p1 are colinear and p1 lies on segment p2q2
    if ((o3 == 0) && onSegment(p2, p1, q2)) {
        return true;
    }

    // p2 , q2 and q1 are colinear and q1 lies on segment p2q2
    if ((o4 == 0) && onSegment(p2, q1, q2)) {
        return true;
    }

    // If none of the cases
    return false;
};
// //////////////////////////////////////////////////////////////

const state = {
    firstClick: true,   // first click
    startClickCoordinate: null,
    endClickCoordinate: null,
    turn: 0,
    // path: new LinkedList(),
    path: [],

    get startOfPathCoordinate() {
        // return this.path.getFirstPathCoordinate();
        return this.path[0];
    },

    get endOfPathCoordinate() {
        // return this.path.getLastPathCoordinate();
        return this.path[this.path.length - 1];
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
                        message: this.firstClick ? "You must start on either end of the path!" : "Invalid move. Try again"
                    }
                };
                break;
            case 'GAME_OVER':
                responseObj = {
                    msg,
                    body: {
                        newLine: null,
                        heading: "Game Over",
                        message: `Player ${this.player} Wins!`
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

const doIntersectWithPath = (endClickCoordinate, headOrTailCoordinate = false, headOrTail = '') => {

    return state.path.some((currentCoordinate, index, array) => {
        // last coordinate won't have another segment
        if (index === array.length - 1) return false;

        const startCoordinate = headOrTailCoordinate || state.startClickCoordinate;

        const pathCoordinateCloserToYAxis = (currentCoordinate.x <= array[index + 1].x) ? currentCoordinate : array[index+1];
        const pathCoordinateFartherFromYAxis = (currentCoordinate.x <= array[index + 1].x) ? array[index+1] : currentCoordinate;
        const clickCoordinateCloserToYAxis = (startCoordinate.x <= endClickCoordinate.x) ? startCoordinate : endClickCoordinate;
        const clickCoordinateFartherFromYAxis = (startCoordinate.x <= endClickCoordinate.x) ? endClickCoordinate : startCoordinate;

        // console.log('pathCoordinateCloserToYAxis=', pathCoordinateCloserToYAxis);
        // console.log('pathCoordinateFartherFromYAxis=', pathCoordinateFartherFromYAxis)
        // console.log('clickCoordinateCloserToYAxis=', clickCoordinateCloserToYAxis)
        // console.log('clickCoordinateFartherFromYAxis=', clickCoordinateFartherFromYAxis)


        // on second turn, we need to check if newly created edge overlaps existing edge
        if (state.turn === 1 && !headOrTailCoordinate) {
            const firstCoordinateForDirection = state.path.filter(coordinate => !checkCoordinatesAreEqual(coordinate, startCoordinate))[0];
            // console.log('firstCoordinateForDirection=', firstCoordinateForDirection);
            // console.log('endClickCoordinate=', endClickCoordinate);
            // console.log('state.startClickCoordinate=', state.startClickCoordinate)

            // const slopePath = (pathCoordinateCloserToYAxis.y - pathCoordinateFartherFromYAxis.y)/(pathCoordinateFartherFromYAxis.x - pathCoordinateCloserToYAxis.x);
            let slopePath;
            if (pathCoordinateCloserToYAxis.y >= pathCoordinateFartherFromYAxis.y) {
                slopePath = (pathCoordinateCloserToYAxis.y - pathCoordinateFartherFromYAxis.y)/(pathCoordinateFartherFromYAxis.x - pathCoordinateCloserToYAxis.x);
            }
            if (pathCoordinateCloserToYAxis.y <= pathCoordinateFartherFromYAxis.y) {
                slopePath = (pathCoordinateCloserToYAxis.y - pathCoordinateFartherFromYAxis.y)/(pathCoordinateFartherFromYAxis.x - pathCoordinateCloserToYAxis.x);
            }
            console.log('slopePath=', slopePath);
            // const slopeClick = (clickCoordinateCloserToYAxis.y - clickCoordinateFartherFromYAxis.y)/(clickCoordinateFartherFromYAxis.x - clickCoordinateCloserToYAxis.x);
            let slopeClick;
            if (clickCoordinateCloserToYAxis.y >= clickCoordinateFartherFromYAxis.y) {
                slopeClick = (clickCoordinateCloserToYAxis.y - clickCoordinateFartherFromYAxis.y)/(clickCoordinateFartherFromYAxis.x - clickCoordinateCloserToYAxis.x);
            }
            if (clickCoordinateCloserToYAxis.y <= clickCoordinateFartherFromYAxis.y) {
                slopeClick = (clickCoordinateCloserToYAxis.y - clickCoordinateFartherFromYAxis.y)/(clickCoordinateFartherFromYAxis.x - clickCoordinateCloserToYAxis.x);
            }
            console.log('slopeClick=', slopeClick)

            if (slopePath === 1 && slopeClick === 1) {
                if (isBetween(firstCoordinateForDirection, endClickCoordinate, startCoordinate)) {
                    return true;
                }
                if (firstCoordinateForDirection.x > startCoordinate.x && (endClickCoordinate.x >= startCoordinate.x)) {
                    return true;
                }
                if (firstCoordinateForDirection.x < startCoordinate.x && (endClickCoordinate.x <= startCoordinate.x)) {
                    return true;
                }
            }
            if (slopePath === -1 && slopeClick === -1) {
                if (isBetween(firstCoordinateForDirection, endClickCoordinate, startCoordinate)) {
                    return true;
                }
                if (firstCoordinateForDirection.x < startCoordinate.x && (endClickCoordinate.x <= startCoordinate.x)) {
                    return true;
                }
                if (firstCoordinateForDirection.x > startCoordinate.x && (endClickCoordinate.x >= startCoordinate.x)) {
                    return true;
                }

            }
            if (slopePath === 0 && slopeClick === 0) {
                if (firstCoordinateForDirection.x > startCoordinate.x && (endClickCoordinate.x >= startCoordinate.x)) {
                    return true;
                }
                if (firstCoordinateForDirection.x < startCoordinate.x && (endClickCoordinate.x <= startCoordinate.x)) {
                    return true;
                }
            }
            if (Math.abs(slopePath) === Infinity && Math.abs(slopeClick) === Infinity) {
                if (firstCoordinateForDirection.y > startCoordinate.y && (endClickCoordinate.y >= startCoordinate.y)) {
                    return true;
                }
                if (firstCoordinateForDirection.y < startCoordinate.y && (endClickCoordinate.y <= startCoordinate.y)) {
                    return true;
                }
            }

        }

        if (headOrTail === 'head' && index === 0) {
            return false;
        }

        if (headOrTail === 'tail' && index === array.length - 2) {
            return false;
        }

        // if checkCoordinatesAreEqual(state.startClickCoordinate, state.startOfPathCoordinate), we don't check intersection with the first element in state.path
        if (checkCoordinatesAreEqual(startCoordinate, state.startOfPathCoordinate) && index === 0) {
            return false
        }
        // if checkCoordinatesAreEqual(state.startClickCoordinate, state.endOfPathCoordinate), we don't check intersection with the last element in state.path)
        if (checkCoordinatesAreEqual(startCoordinate, state.endOfPathCoordinate) && index === array.length - 2) {
            return false
        }


        return doIntersect(currentCoordinate, array[index + 1], startCoordinate, endClickCoordinate);
    })
}

// reset state after invalid second click
const resetStateToFirstClick = () => {
    if (state.turn === 0) {
        // remove first (and the only one) node in state.path
    }
    state.firstClick = true;
    // state.startClickCoordinate = null;
    // state.endClickCoordinate = null;
}

// proceed to next player's turn
const nextPlayerTurn = () => {
    if (state.turn === 0) {
        // if it is a first turn, we need to add both first and last nodes(coordinates) to path
        // state.path.insertFirstNode(state.startClickCoordinate);
        // state.path.insertLastNode(state.endClickCoordinate);
        state.path.unshift(state.startClickCoordinate);
        state.path.push(state.endClickCoordinate);
    } else if (checkCoordinatesAreEqual(state.startClickCoordinate, state.startOfPathCoordinate)) {
        // else if state.firstClickCoordinate is equal to state.startOfPathCoordinate, then we insert in the beginning of the path
        // state.path.insertFirstNode(state.endClickCoordinate);
        state.path.unshift(state.endClickCoordinate);
    } else {
        // otherwise, we insert at the end of the path
        state.path.push(state.endClickCoordinate);
    }
    // state.turn++;
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
        // console.log('line is octilinear: horizontal or vertical')
        return true;
    }
    const slope = Math.abs((coordinate1.x - coordinate2.x) / (coordinate1.y - coordinate2.y));
    if (slope === 1) {
        // console.log('line is octilinear: slope 1')
        return true;
    }
}

// returns true if coordinate if valid, false otherwise
const checkSecondCoordinateIsValid = (endClickCoordinate) => {
    // check if there is an intersection between edges
    console.log('doIntersectWithPath=', doIntersectWithPath(endClickCoordinate));
    // console.log('endClickCoordinate on path=', checkCoordinatesAreEqual())
    if (doIntersectWithPath(endClickCoordinate)) {
        return false;
    }

    // if user clicked on the same coordinate on his/her second click
    if (checkCoordinatesAreEqual(state.startClickCoordinate, endClickCoordinate)) {
        return false;
    }
    // check if line is Octilinear
    if (checkLineIsOctilinear(state.startClickCoordinate, endClickCoordinate)) {
        return true;
    }
    return false;
}

// creates array of nodes around head or tail node with only non-negative coordinates
const createArrayOfNodesAroundHeadOrTail = (coordinate) => {
    const newEmptyArray = new Array(8);
    const arrayOfNodesAroundHeadOrTail = [
        {
            x: coordinate.x - 1,
            y: coordinate.y - 1,
        },
        {
            x: coordinate.x,
            y: coordinate.y - 1,
        },
        {
            x: coordinate.x + 1 ,
            y: coordinate.y - 1,
        },
        {
            x: coordinate.x - 1,
            y: coordinate.y
        },
        {
            x: coordinate.x+1,
            y: coordinate.y,
        },
        {
            x: coordinate.x - 1,
            y: coordinate.y + 1,
        },
        {
            x: coordinate.x,
            y: coordinate.y + 1,
        },
        {
            x: coordinate.x + 1,
            y: coordinate.y + 1
        }
    ].filter(element => element.x >= 0 && element.y >= 0 && element.x < FIELD_DIMENSIONS && element.y < FIELD_DIMENSIONS);
    return arrayOfNodesAroundHeadOrTail;
}

// Check if point is on segment
const isBetween = (a, b, c) => {
    // when edge is horizontal

    if (a.y === c.y) {
        if ((a.x < c.x) && b.x >= a.x && b.x <= c.x && b.y === a.y) {
            return true;
        }
        if ((a.x > c.x) && b.x >= c.x && b.x <= a.x && b.y === a.y) {
            return true;
        }
    }
    // when edge is vertical
    if (a.x === c.x) {
        if ((a.y < c.y) && b.y >= a.y && b.y <= c.y && b.x === a.x) {
            return true;
        }
        if ((a.y > c.y) && b.y <= a.y && b.y >= c.y && b.x === a.x) {
            return true
        }
    }
    // when 45 degrees
    // when slope is 1 and a is closer to y-axis
    if ((a.x < c.x && a.y > c.y)) {
        if ((a.y - b.y)/(b.x - a.x) === 1 && (b.y - c.y)/(c.x - b.x) === 1 && b.x >= a.x && b.x <= c.x && b.y <= a.y && b.y >= c.y) {
            return true;
        }
    }
    // when slope is 1 and c is closer to y-axis
    if (a.x > c.x && a.y < c.y) {
        if ((b.y - a.y)/(a.x - b.x) === 1 && (c.y - b.y)/(b.x - c.x) === 1 && b.x <= a.x && b.x >= c.x && b.y <= c.y && b.y >= a.y) {
            return true;
        }
    }
    // when slope is -1 and a is closer to y-axis
    if (a.x < c.x && a.y < c.y) {
        if ((b.y - a.y)/(b.x - a.x) === 1 && b.x >= a.x && b.x <= c.x && b.y >= a.y && b.y <= c.y) {
            return true;
        }
    }
    // when slope is -1 and c closer to y-axis
    if (a.x > c.x && a.y > c.y) {
        if ((b.y - c.y)/(b.x - c.x) === 1 && b.x >= c.x && b.x <= a.x && b.y >= c.y && b.y <= a.y) {
            return true;
        }
    }
    return false

}

// /////////////////////////////////////////

const checkIfWinner = () => {

    // starting from the second turn
    // check if we can build any new node (at least one unit long) either from 'head' or 'tail' of path

    if (state.turn === 0) return false;
    console.log('state.startOfPathCoordinate=', state.startOfPathCoordinate);
    console.log('state.endClickCoordinate=', state.endClickCoordinate);
    // build array of nodes around endOfPathCoordinate
    const arrayOfNodesHead = createArrayOfNodesAroundHeadOrTail(state.startOfPathCoordinate);
    const arrayOfNodesTail = createArrayOfNodesAroundHeadOrTail(state.endClickCoordinate);

    console.log('arrayOfNodesHead=', arrayOfNodesHead);
    console.log('arrayOfNodesTail=', arrayOfNodesTail);

    // remove the point that lies on the first edge of path at head and tail
    const arrayOfNodesHeadNew = arrayOfNodesHead.filter(element => !isBetween(state.startOfPathCoordinate, element, state.path[1]));
    console.log('arrayOfNodesHeadNew', arrayOfNodesHeadNew);
    debugger;
    const arrayOfNodesTailNew = arrayOfNodesTail.filter(element => {
        console.log('isBetween in tail=', state.endClickCoordinate, element, state.path[state.path.length - 2])
        return !isBetween(state.endClickCoordinate, element, state.path[state.path.length - 2])
    });
    console.log('arrayOfNodesTailNew=', arrayOfNodesTailNew);

    // returns true if possible to draw a new edge at head
    const possibleEdgeAtHead = arrayOfNodesHeadNew.some(coordinate => {
        return !doIntersectWithPath(coordinate, state.startOfPathCoordinate, 'head')
    });
    // returns true if possible to draw a new edge at tail
    const possibleEdgeAtTail = arrayOfNodesTailNew.some(coordinate => !doIntersectWithPath(coordinate, state.endClickCoordinate, 'tail'));

    console.log('possibleEdgeAtHead=', possibleEdgeAtHead);
    console.log('possibleEdgeAtTail=', possibleEdgeAtTail)

    console.log('winner = ', (possibleEdgeAtHead === false && possibleEdgeAtTail === false) || false);

    return (possibleEdgeAtHead === false && possibleEdgeAtTail === false) || false;

}

// coordinate is in form {x: Number, y: Number}
const handleNodeClicked = (coordinate, msg) => {
    // check if it is a first click of a player
    if (state.firstClick) {

        // check if the first clicked node is valid
        if (checkFirstCoordinateIsValid(coordinate)) {
            state.startClickCoordinate = coordinate;
            app.ports.response.send(state.formResponseObj('VALID_START_NODE'));
            state.firstClick = false;
            return;
        } else {
            // console.log('invalid start mode');
            // console.log('response INVALID START NODE =', state.formResponseObj('INVALID_START_NODE'));
            app.ports.response.send(state.formResponseObj('INVALID_START_NODE'));
            resetStateToFirstClick();
            return;
        }
    };

    // check if the second clicked node is valid
    // !!!!!! implement logic to prevent overlapping segments
    if (!checkSecondCoordinateIsValid(coordinate)) {
        app.ports.response.send(state.formResponseObj('INVALID_END_NODE'));
        resetStateToFirstClick();
        return;
    }

    // it is a second click of a player
    state.endClickCoordinate = coordinate;
    nextPlayerTurn();
    if (checkIfWinner()) {
        app.ports.response.send(state.formResponseObj('VALID_END_NODE'));
        return app.ports.response.send(state.formResponseObj('GAME_OVER'));
    }

    state.turn++;
    app.ports.response.send(state.formResponseObj('VALID_END_NODE'));
    state.firstClick = true;
}

app.ports.request.subscribe((message) => {
    message = JSON.parse(message);

    // Parse the message to determine a response, then respond:
    if (message.msg === 'INITIALIZE') {
        startGame(message.msg);
    };

    if (message.msg === 'NODE_CLICKED') {
        handleNodeClicked(message.body, message.msg);
    }

    console.log('state=', state);
});
