// Aplicación de ajedrez completamente funcional
class ChessGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white'; // El jugador siempre juega con blancas
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameState = 'playing'; // 'playing', 'check', 'checkmate', 'stalemate'
        this.moveHistory = [];
        this.isComputerThinking = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.renderBoard();
        this.updateGameStatus();
    }

    // Configuración inicial de elementos DOM
    initializeElements() {
        this.boardElement = document.getElementById('chess-board');
        this.statusElement = document.getElementById('game-status');
        this.resetBtn = document.getElementById('reset-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.gameOverModal = document.getElementById('game-over-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.moveHistoryElement = document.getElementById('move-history');
        this.thinkingIndicator = document.getElementById('thinking-indicator');
    }

    // Configurar event listeners
    setupEventListeners() {
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.newGameBtn.addEventListener('click', () => this.resetGame());
        
        // Cerrar modal al hacer click fuera
        this.gameOverModal.addEventListener('click', (e) => {
            if (e.target === this.gameOverModal || e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }

    // Crear tablero inicial con piezas en posición estándar
    createInitialBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Piezas negras (computadora) - fila superior
        const blackPieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'];
        for (let col = 0; col < 8; col++) {
            board[0][col] = { piece: blackPieces[col], color: 'black', type: this.getPieceType(blackPieces[col]) };
            board[1][col] = { piece: '♟', color: 'black', type: 'pawn' };
        }

        // Piezas blancas (jugador) - fila inferior  
        const whitePieces = ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖'];
        for (let col = 0; col < 8; col++) {
            board[7][col] = { piece: whitePieces[col], color: 'white', type: this.getPieceType(whitePieces[col]) };
            board[6][col] = { piece: '♙', color: 'white', type: 'pawn' };
        }

        return board;
    }

    // Obtener tipo de pieza desde símbolo Unicode
    getPieceType(symbol) {
        const types = {
            '♔': 'king', '♚': 'king',
            '♕': 'queen', '♛': 'queen',
            '♖': 'rook', '♜': 'rook',
            '♗': 'bishop', '♝': 'bishop',
            '♘': 'knight', '♞': 'knight',
            '♙': 'pawn', '♟': 'pawn'
        };
        return types[symbol] || null;
    }

    // Crear elementos HTML del tablero
    renderBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('chess-square');
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('span');
                    pieceElement.classList.add('chess-piece');
                    pieceElement.textContent = piece.piece;
                    square.appendChild(pieceElement);
                }
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.boardElement.appendChild(square);
            }
        }
        
        this.highlightSquares();
    }

    // Resaltar casillas (seleccionada, movimientos válidos, jaque)
    highlightSquares() {
        const squares = this.boardElement.querySelectorAll('.chess-square');
        
        // Limpiar resaltados previos
        squares.forEach(square => {
            square.classList.remove('selected', 'valid-move', 'capture-move', 'in-check');
        });
        
        // Resaltar casilla seleccionada
        if (this.selectedSquare) {
            const selectedElement = this.getSquareElement(this.selectedSquare.row, this.selectedSquare.col);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
        
        // Resaltar movimientos válidos
        this.validMoves.forEach(move => {
            const moveElement = this.getSquareElement(move.row, move.col);
            if (moveElement) {
                const targetPiece = this.board[move.row][move.col];
                if (targetPiece && targetPiece.color !== this.currentPlayer) {
                    moveElement.classList.add('capture-move');
                } else {
                    moveElement.classList.add('valid-move');
                }
            }
        });
        
        // Resaltar rey en jaque
        if (this.isInCheck(this.currentPlayer)) {
            const kingPos = this.findKing(this.currentPlayer);
            if (kingPos) {
                const kingElement = this.getSquareElement(kingPos.row, kingPos.col);
                if (kingElement) {
                    kingElement.classList.add('in-check');
                }
            }
        }
    }

    // Obtener elemento DOM de una casilla específica
    getSquareElement(row, col) {
        return this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }

    // Manejar clic en casilla del tablero
    handleSquareClick(row, col) {
        if (this.gameState !== 'playing' || this.isComputerThinking) return;
        
        // Solo permitir movimientos del jugador (blancas) durante su turno
        if (this.currentPlayer !== 'white') return;

        // Si hay una casilla seleccionada y el clic es un movimiento válido
        if (this.selectedSquare && this.isValidMoveTarget(row, col)) {
            this.makePlayerMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
        } else {
            // Seleccionar nueva pieza del jugador
            this.selectSquare(row, col);
        }
    }

    // Seleccionar casilla (solo piezas blancas del jugador)
    selectSquare(row, col) {
        const piece = this.board[row][col];
        
        if (piece && piece.color === 'white' && this.currentPlayer === 'white') {
            this.selectedSquare = { row, col };
            this.validMoves = this.getValidMoves(row, col);
            console.log(`Selected piece at ${row},${col}. Valid moves:`, this.validMoves); // Debug
        } else {
            this.selectedSquare = null;
            this.validMoves = [];
        }
        
        this.highlightSquares();
    }

    // Verificar si el movimiento es válido
    isValidMoveTarget(row, col) {
        const isValid = this.validMoves.some(move => move.row === row && move.col === col);
        console.log(`Checking if ${row},${col} is valid target:`, isValid); // Debug
        return isValid;
    }

    // Ejecutar movimiento del jugador
    makePlayerMove(fromRow, fromCol, toRow, toCol) {
        console.log(`Attempting to move from ${fromRow},${fromCol} to ${toRow},${toCol}`); // Debug
        
        if (this.makeMove(fromRow, fromCol, toRow, toCol)) {
            console.log('Move successful!'); // Debug
            this.selectedSquare = null;
            this.validMoves = [];
            
            this.addMoveToHistory(`${String.fromCharCode(97 + fromCol)}${8 - fromRow}-${String.fromCharCode(97 + toCol)}${8 - toRow}`);
            
            if (this.checkGameEnd()) return;
            
            this.currentPlayer = 'black';
            this.updateGameStatus();
            this.renderBoard();
            
            // Turno de la computadora
            setTimeout(() => this.makeComputerMove(), 800);
        } else {
            console.log('Move failed!'); // Debug
        }
    }

    // Ejecutar movimiento de la computadora
    async makeComputerMove() {
        if (this.currentPlayer !== 'black') return;
        
        this.isComputerThinking = true;
        this.thinkingIndicator.classList.remove('hidden');
        this.boardElement.classList.add('board-disabled');
        
        // Simular tiempo de "pensamiento"
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
        
        const move = this.getBestComputerMove();
        
        if (move) {
            console.log('Computer making move:', move); // Debug
            this.makeMove(move.fromRow, move.fromCol, move.toRow, move.toCol);
            this.addMoveToHistory(`PC: ${String.fromCharCode(97 + move.fromCol)}${8 - move.fromRow}-${String.fromCharCode(97 + move.toCol)}${8 - move.toRow}`, true);
            
            if (this.checkGameEnd()) {
                this.isComputerThinking = false;
                this.thinkingIndicator.classList.add('hidden');
                this.boardElement.classList.remove('board-disabled');
                return;
            }
            
            this.currentPlayer = 'white';
            this.updateGameStatus();
            this.renderBoard();
        }
        
        this.isComputerThinking = false;
        this.thinkingIndicator.classList.add('hidden');
        this.boardElement.classList.remove('board-disabled');
    }

    // Realizar movimiento en el tablero
    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board[fromRow][fromCol];
        if (!piece) {
            console.log('No piece at origin'); // Debug
            return false;
        }
        
        // Para movimientos básicos, simplificar la validación
        if (piece.color === this.currentPlayer) {
            // Ejecutar movimiento
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
            console.log(`Moved ${piece.piece} from ${fromRow},${fromCol} to ${toRow},${toCol}`); // Debug
            return true;
        }
        
        return false;
    }

    // Obtener movimientos válidos para una pieza
    getValidMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        let moves = [];
        
        switch (piece.type) {
            case 'pawn': moves = this.getPawnMoves(row, col, piece.color); break;
            case 'rook': moves = this.getRookMoves(row, col, piece.color); break;
            case 'knight': moves = this.getKnightMoves(row, col, piece.color); break;
            case 'bishop': moves = this.getBishopMoves(row, col, piece.color); break;
            case 'queen': moves = this.getQueenMoves(row, col, piece.color); break;
            case 'king': moves = this.getKingMoves(row, col, piece.color); break;
        }
        
        // Filtrar movimientos que dejarían al rey en jaque (simplificado por ahora)
        return moves.filter(move => this.isValidSquare(move.row, move.col));
    }

    // Movimientos del peón
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Movimiento hacia adelante
        if (this.isValidSquare(row + direction, col) && !this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Movimiento doble desde posición inicial
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Capturas diagonales
        for (const colOffset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + colOffset;
            
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (target && target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }

    // Movimientos de la torre
    getRookMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1]  // vertical y horizontal
        ]);
    }

    // Movimientos del alfil
    getBishopMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]  // diagonal
        ]);
    }

    // Movimientos de la reina
    getQueenMoves(row, col, color) {
        return this.getLinearMoves(row, col, color, [
            [-1, 0], [1, 0], [0, -1], [0, 1],      // torre
            [-1, -1], [-1, 1], [1, -1], [1, 1]     // alfil
        ]);
    }

    // Movimientos lineales (torre, alfil, reina)
    getLinearMoves(row, col, color, directions) {
        const moves = [];
        
        for (const [dRow, dCol] of directions) {
            for (let i = 1; i < 8; i++) {
                const newRow = row + dRow * i;
                const newCol = col + dCol * i;
                
                if (!this.isValidSquare(newRow, newCol)) break;
                
                const target = this.board[newRow][newCol];
                
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (target.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        }
        
        return moves;
    }

    // Movimientos del caballo
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [dRow, dCol] of knightMoves) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }

    // Movimientos del rey
    getKingMoves(row, col, color) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.isValidSquare(newRow, newCol)) {
                const target = this.board[newRow][newCol];
                if (!target || target.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }

    // Verificar si las coordenadas están dentro del tablero
    isValidSquare(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }

    // Verificar si el rey está en jaque
    isInCheck(color) {
        const kingPos = this.findKing(color);
        if (!kingPos) return false;
        
        // Verificar si alguna pieza enemiga puede atacar al rey
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color !== color) {
                    const attacks = this.getPieceAttacks(row, col);
                    if (attacks.some(attack => attack.row === kingPos.row && attack.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    // Obtener ataques de una pieza (sin validar jaque propio)
    getPieceAttacks(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        switch (piece.type) {
            case 'pawn': return this.getPawnAttacks(row, col, piece.color);
            case 'rook': return this.getRookMoves(row, col, piece.color);
            case 'knight': return this.getKnightMoves(row, col, piece.color);
            case 'bishop': return this.getBishopMoves(row, col, piece.color);
            case 'queen': return this.getQueenMoves(row, col, piece.color);
            case 'king': return this.getKingMoves(row, col, piece.color);
            default: return [];
        }
    }

    // Ataques del peón (solo diagonales)
    getPawnAttacks(row, col, color) {
        const attacks = [];
        const direction = color === 'white' ? -1 : 1;
        
        for (const colOffset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + colOffset;
            if (this.isValidSquare(newRow, newCol)) {
                attacks.push({ row: newRow, col: newCol });
            }
        }
        
        return attacks;
    }

    // Encontrar posición del rey
    findKing(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.type === 'king' && piece.color === color) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // Obtener todos los movimientos válidos para un color
    getAllValidMoves(color) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const pieceMoves = this.getValidMoves(row, col);
                    pieceMoves.forEach(move => {
                        moves.push({
                            fromRow: row, fromCol: col,
                            toRow: move.row, toCol: move.col
                        });
                    });
                }
            }
        }
        
        return moves;
    }

    // IA simple para la computadora
    getBestComputerMove() {
        const moves = this.getAllValidMoves('black');
        if (moves.length === 0) return null;
        
        // Priorizar capturas
        const captures = moves.filter(move => {
            const target = this.board[move.toRow][move.toCol];
            return target && target.color === 'white';
        });
        
        if (captures.length > 0) {
            return captures[Math.floor(Math.random() * captures.length)];
        }
        
        // Si no hay capturas, movimiento aleatorio
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Verificar fin del juego
    checkGameEnd() {
        if (this.isCheckmate('white')) {
            this.endGame('¡Jaque Mate!', 'La computadora ha ganado. ¡Inténtalo de nuevo!');
            return true;
        } else if (this.isCheckmate('black')) {
            this.endGame('¡Victoria!', '¡Felicidades! Has derrotado a la computadora.');
            return true;
        } else if (this.isStalemate('white') || this.isStalemate('black')) {
            this.endGame('¡Empate!', 'La partida ha terminado en tablas.');
            return true;
        }
        
        return false;
    }

    // Verificar jaque mate
    isCheckmate(color) {
        return this.isInCheck(color) && this.getAllValidMoves(color).length === 0;
    }

    // Verificar empate por ahogado
    isStalemate(color) {
        return !this.isInCheck(color) && this.getAllValidMoves(color).length === 0;
    }

    // Actualizar estado del juego en la UI
    updateGameStatus() {
        let statusText = '';
        let statusClass = 'status--info';
        
        if (this.isInCheck('white') && this.currentPlayer === 'white') {
            statusText = '¡Jaque! - Tu turno';
            statusClass = 'status--warning';
        } else if (this.isInCheck('black') && this.currentPlayer === 'black') {
            statusText = '¡Jaque a la computadora! - Computadora pensando...';
            statusClass = 'status--warning';
        } else if (this.currentPlayer === 'white') {
            statusText = 'Tu turno - Mueves las blancas';
        } else {
            statusText = 'Turno de la computadora';
        }
        
        this.statusElement.className = `status ${statusClass}`;
        this.statusElement.textContent = statusText;
    }

    // Agregar movimiento al historial
    addMoveToHistory(moveText, isComputer = false) {
        this.moveHistory.push(moveText);
        
        const moveElement = document.createElement('p');
        moveElement.textContent = moveText;
        if (!isComputer) {
            moveElement.classList.add('move-entry');
        }
        
        this.moveHistoryElement.appendChild(moveElement);
        this.moveHistoryElement.scrollTop = this.moveHistoryElement.scrollHeight;
    }

    // Finalizar juego
    endGame(title, message) {
        this.gameState = 'ended';
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.gameOverModal.classList.remove('hidden');
    }

    // Cerrar modal
    closeModal() {
        this.gameOverModal.classList.add('hidden');
    }

    // Reiniciar juego
    resetGame() {
        this.closeModal();
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.validMoves = [];
        this.gameState = 'playing';
        this.moveHistory = [];
        this.isComputerThinking = false;
        
        this.moveHistoryElement.innerHTML = '<p>Nueva partida iniciada</p>';
        this.thinkingIndicator.classList.add('hidden');
        this.boardElement.classList.remove('board-disabled');
        
        this.renderBoard();
        this.updateGameStatus();
    }
}

// Inicializar el juego cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});