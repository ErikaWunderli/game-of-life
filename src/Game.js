import $ from 'jquery';
import React from 'react';
import './Game.css';
import axios from 'axios';


const CELL_SIZE = 20;
const WIDTH = 500;
const HEIGHT = 500;
var _generation = 0;


class Cell extends React.Component {

    render() {
        const { x, y } = this.props;
        return (
            <div className="Cell" style={{
                left: `${CELL_SIZE * x + 1}px`,
                top: `${CELL_SIZE * y + 1}px`,
                width: `${CELL_SIZE - 1}px`,
                height: `${CELL_SIZE - 1}px`,
            }} />
        );
    }
}


export default class Game extends React.Component {

    constructor() {
        super();
        this.rows = HEIGHT / CELL_SIZE;
        this.cols = WIDTH / CELL_SIZE;
        this.survival = [2, 3];
        this.birth = [3];
        this.board = this.makeEmptyBoard();
    }

    state = {
        cells: [],
        isRunning: false,
        interval: 100,
    }

    makeEmptyBoard() {
        let board = [];
        for (let y = 0; y < this.rows; y++) {
            board[y] = [];
            for (let x = 0; x < this.cols; x++) {
                board[y][x] = false;
            }
        }

        return board;
    }

    getElementOffset() {
        const rect = this.boardRef.getBoundingClientRect();
        const doc = document.documentElement;

        return {
            x: (rect.left + window.pageXOffset) - doc.clientLeft,
            y: (rect.top + window.pageYOffset) - doc.clientTop,
        };
    }

    makeCells() {
        console.log(this.board);
        let cells = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    cells.push({ x, y });
                }
            }
        }

        return cells;
    }

    handleClick = (event) => {

        const elemOffset = this.getElementOffset();
        const offsetX = event.clientX - elemOffset.x;
        const offsetY = event.clientY - elemOffset.y;
        
        const x = Math.floor(offsetX / CELL_SIZE);
        const y = Math.floor(offsetY / CELL_SIZE);

        if (x >= 0 && x <= this.cols && y >= 0 && y <= this.rows) {
            this.board[y][x] = !this.board[y][x];
        }

        this.setState({ cells: this.makeCells() });
    }

    runGame = () => {
        this.setState({ isRunning: true });
        this.runIteration();
        
    }

    stopGame = () => {
        this.setState({ isRunning: false });
        if (this.timeoutHandler) {
            window.clearTimeout(this.timeoutHandler);
            this.timeoutHandler = null;
        }
    }
    
    stepGame = () => {
        this.runForward();
}

    runForward () {
        let newBoard = this.makeEmptyBoard();

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                let neighbors = this.calculateNeighbors(this.board, x, y);
                if (this.board[y][x]) {
                    if (this.survival.includes(neighbors)) {
                        newBoard[y][x] = true;
                    } else {
                        newBoard[y][x] = false;
                    }
                } else {
                    if (!this.board[y][x] && this.birth.includes(neighbors)) {
                        newBoard[y][x] = true;
                    }
                }
            }
        }

        this.board = newBoard;
        this.setState({ cells: this.makeCells() });
        _generation++;

}

    runIteration() {
        this.runForward();
        this.timeoutHandler = window.setTimeout(() => {
            this.runIteration();
        }, this.state.interval);
    }



    /**
     * Calculate the number of neighbors at point (x, y)
     * @param {Array} board 
     * @param {int} x 
     * @param {int} y 
     */
    calculateNeighbors(board, x, y) {
        let neighbors = 0;
        const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];
        for (let i = 0; i < dirs.length; i++) {
            const dir = dirs[i];
            let y1 = y + dir[0];
            let x1 = x + dir[1];

            if (x1 >= 0 && x1 < this.cols && y1 >= 0 && y1 < this.rows && board[y1][x1]) {
                neighbors++;
            }
        }

        return neighbors;
    }

    handleIntervalChange = (event) => {
        this.setState({ interval: event.target.value });
    }

    handleClear = () => {
        this.board = this.makeEmptyBoard();
        this.setState({ cells: this.makeCells() });
        _generation = 0;
    }

    handleRandom = () => {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.board[y][x] = (Math.random() >= 0.5);
            }
        }

        this.setState({ cells: this.makeCells() });
    }

    handleSubmit = event => {
        event.preventDefault();
        const data = new FormData(event.target);

        axios.post('http://localhost:5000/from_file', data).then(response => {
            let newBoard = this.makeEmptyBoard();
            let leftUp = response.data.position;
            leftUp[0] = leftUp[0] + Math.round(this.rows/2);
            leftUp[1] = leftUp[1] + Math.round(this.cols/2);

            for (let i = 0; i < response.data.pattern.length; ++i) {
                for (let j = 0; j < response.data.pattern[i].length; ++j) {
                    newBoard[i+leftUp[0]][j+leftUp[1]] = response.data.pattern[i][j] === 1;
                }
            }

            this.survival = response.data.survival;
            this.birth = response.data.birth;
            this.board = newBoard;
            this.setState({ cells: this.makeCells() });
            console.log(response.data);
        });

    }
   

    render() {
        $(document).ready(function () {
            $("#importForms").click(function () {
                $("#list").toggle();
            });
        });
        const { cells, interval, isRunning } = this.state;
        return (
            <div>
                <div className="Board"
                    style={{ width: WIDTH, height: HEIGHT, backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`}}
                    onClick={this.handleClick}
                    ref={(n) => { this.boardRef = n; }}>

                    {cells.map(cell => (
                        <Cell x={cell.x} y={cell.y} key={`${cell.x},${cell.y}`}/>
                    ))}
                </div>

                <div className="controls">
                    Generations: <input value={_generation} onChange={this.handleIntervalChange} />
                    {isRunning ?
                        <button className="button" onClick={this.stopGame}>Stop</button> :
                        <button className="button" onClick={this.runGame}>Run</button>
                    }
                    <button className="button" onClick={this.stepGame}>Step</button>
                    <button className="button" onClick={this.handleClear}>Clear</button>
                    <button className="button" onClick={this.handleRandom}>Random</button>

                    <form onSubmit={this.handleSubmit}>
                        <input type="file" name="file" />
                        <input type="submit" value="Upload" />
                    </form>
                </div>
            </div>
        );
    }
}

//export default Game;



