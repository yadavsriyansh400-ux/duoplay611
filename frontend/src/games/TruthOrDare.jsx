
import { useState } from 'react';
import './TruthOrDare.css';

export default function TruthOrDare({
    room,
    socket,
    currentUserId,
    onLeaveGame,
}) {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const state = room?.truthOrDareState;

    if (!state || room.players.length < 2) {
        return (
            <section className="tod-card">
                <h2>Truth or Dare</h2>
                <p>Waiting for both players to join...</p>
            </section>
        );
    }

    const myId = String(currentUserId || '');
    const giverId = String(state.currentGiver || '');
    const isGiver = myId === giverId;
    const isTaker = !isGiver;
    const phase = state.phase;

    const sendAction = (eventName, payload = {}) => {
        if (!socket || busy) return;

        setBusy(true);
        setMessage('');

        socket.emit(eventName, { roomCode: room.roomCode, ...payload });

        // The server sends an updated state or an error.
        // A timeout prevents the button remaining disabled indefinitely.
        setTimeout(() => setBusy(false), 700);
    };

    return (
        <section className="tod-card">
            <p className="tod-eyebrow">DUOPLAY611 · TWO PLAYER GAME</p>
            <h2>Truth or Dare</h2>

            <p className="tod-status">
                {isGiver ? "You're the giver" : "You're answering"}
            </p>

            {phase === 'choosing' && (
                <div className="tod-actions">
                    {isGiver ? (
                        <>
                            <p>Ask your friend: Truth or Dare?</p>
                            <button
                                disabled={busy}
                                onClick={() =>
                                    sendAction('chooseTruthOrDare', { choice: 'truth' })
                                }
                                className='tod-btn-truth'
                            >
                                Truth
                            </button>
                            <button
                                disabled={busy}
                                onClick={() =>
                                    sendAction('chooseTruthOrDare', { choice: 'dare' })
                                }
                                className='tod-btn-dare'
                            >
                                Dare
                            </button>
                        </>
                    ) : (
                        <p>Waiting for the giver to choose Truth or Dare...</p>
                    )}
                </div>
            )}

            {phase === 'dare-category' && (
                <div className="tod-actions">
                    {isGiver ? (
                        <>
                            <p>Choose a dare category</p>
                            <button
                                disabled={busy}
                                onClick={() =>
                                    sendAction('chooseDareCategory', { category: 'fun' })
                                }
                                className='tod-btn-fun'
                            >
                                Fun Dare
                            </button>
                            <button
                                disabled={busy}
                                onClick={() =>
                                    sendAction('chooseDareCategory', { category: 'couple' })
                                }
                                className='tod-btn-couple'
                            >
                                Couple Dare
                            </button>
                            <button
                                disabled={busy}
                                onClick={() =>
                                    sendAction('chooseDareCategory', { category: 'spicy' })
                                }
                                className='tod-btn-spicy'
                            >
                                Spicy Dare
                            </button>
                        </>
                    ) : (
                        <p>Waiting for the giver to select a dare category...</p>
                    )}
                </div>
            )}

            {(phase === 'truth' || phase === 'dare') && (
                <div className="tod-prompt">
                    <p className="tod-eyebrow">
                        {phase === 'truth' ? 'YOUR TRUTH QUESTION' : 'YOUR DARE'}
                    </p>

                    <h3>{state.currentPrompt}</h3>

                    {isTaker ? (
                        <div className="tod-actions">
                            {phase === 'dare' && (
                                <button
                                    disabled={busy}
                                    onClick={() => sendAction('rerollDare')}
                                    className='tod-btn-reroll'
                                >
                                    Reroll Dare
                                </button>
                            )}

                            {phase === 'truth' && (
                                <button
                                    disabled={busy}
                                    onClick={() => sendAction('rerollTruth')}
                                    className='tod-btn-reroll'
                                >
                                    Reroll Truth
                                </button>
                            )}

                            <button
                                disabled={busy}
                                onClick={() => sendAction('completeTruthOrDareTurn')}
                                className='tod-btn-done'
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        <p>Waiting for your friend to finish...</p>
                    )}
                </div>
            )}

            {phase === 'finished' && <p>This game has finished.</p>}

            {message && <p role="status">{message}</p>}

            <button className="tod-leave" onClick={onLeaveGame}>
                Leave Game
            </button>
        </section>
    );
}
