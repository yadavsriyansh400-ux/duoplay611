
import '../App.css';

export default function TicTacToe({
    room,
    onMakeMove,
    currentUserId,
    loadingMove,
    onRequestRematch,
    rematchLoading,
    onLeaveGame,
}) {
    const gameState = room?.gameState;

    if (!gameState) {
        return <p>Waiting for the game to initialize...</p>;
    }

    const board = gameState.board || [];
    const symbols = gameState.symbols || {};

    const mySymbol =
        symbols[currentUserId] ||
        symbols[String(currentUserId)];

    const currentTurnId =
        gameState.currentTurn?._id ||
        gameState.currentTurn;

    const isMyTurn =
        currentTurnId &&
        String(currentTurnId) === String(currentUserId);

    const winnerId =
        gameState.winner?._id ||
        gameState.winner;

    let message = 'Waiting for the opponent...';

    if (gameState.result === 'won') {
        message =
            String(winnerId) === String(currentUserId)
                ? 'You won! 🎉'
                : 'Your opponent won!';
    } else if (gameState.result === 'draw') {
        message = "It's a draw!";
    } else if (isMyTurn) {
        message = `Your turn (${mySymbol || '?'})`;
    } else if (currentTurnId) {
        message = 'Opponent’s turn';
    }

    return (
        <section className="tic-tac-toe">
            <h2>Tic-Tac-Toe</h2>

            <p
                className={`tic-tac-toe-status ${gameState.result === 'won'
                        ? 'tic-tac-toe-won'
                        : gameState.result === 'draw'
                            ? 'tic-tac-toe-draw'
                            : isMyTurn
                                ? 'tic-tac-toe-my-turn'
                                : ''
                    }`}
            >
                {message}
            </p>

            <div className="tic-tac-toe-board">
                {Array.from({ length: 9 }, (_, index) => {
                    const cell = board[index] || '';

                    const disabled =
                        loadingMove ||
                        !isMyTurn ||
                        gameState.result !== 'playing' ||
                        cell !== '';

                    return (
                        <button
                            key={index}
                            type="button"
                            className={`tic-tac-toe-cell ${cell === 'X' ? 'tic-tac-toe-x' :
                                cell === 'O' ? 'tic-tac-toe-o' : ''
                                }`}
                            disabled={disabled}
                            onClick={() => onMakeMove(index)}
                            aria-label={`Cell ${index + 1}${cell ? `: ${cell}` : ': empty'}`}
                        >
                            {cell}
                        </button>
                    );
                })}
            </div>

            <p>Your symbol: {mySymbol || 'Not assigned yet'}</p>

            {gameState.result !== 'playing' && (
                <div className="rematch-section">
                    <h3>Play another round?</h3>


                    {gameState.result !== 'playing' && (
                        <div className="rematch-section">

                            <button
                                type="button"
                                className="game-play-button"
                                onClick={onRequestRematch}
                                disabled={rematchLoading}
                            >
                                {rematchLoading ? 'Sending request...' : 'Play Again'}
                            </button>

                            <p className="auth-description">
                                {gameState.replayVotes?.some(
                                    (id) => String(id?._id || id) === String(currentUserId)
                                )
                                    ? 'You agreed to play again! Waiting for your opponent...'
                                    : 'Both players must agree before a new round begins.'}
                            </p>

                            <button
                                type="button"
                                className="room-back-button"
                                onClick={onLeaveGame}
                            >
                                Leave Game
                            </button>
                        </div>
                    )}


                    <p className="auth-description">
                        Choose whether you want to continue playing.
                    </p>
                </div>
            )}

        </section>
    );
}
