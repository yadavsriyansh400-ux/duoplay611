import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';
import { io } from 'socket.io-client';
import TicTacToe from '../games/TicTacToe.jsx';
import TruthOrDare from '../games/TruthOrDare.jsx';
import { API_URL, SOCKET_URL } from "../config";

export default function RoomPage() {
    console.log('RoomPage component is redering');
    const { roomCode } = useParams();
    const navigate = useNavigate();
    const [room, setRoom] = useState(null);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loadingMove, setLoadingMove] = useState(false);
    const [rematchLoading, setRematchLoading] = useState(false);


    useEffect(() => {
        const token = sessionStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        const socket = io(SOCKET_URL, {
            auth: { token },
        });

        socket.on('connect', () => {
            console.log('Authenticated Socket.IO connection:', socket.id);
            setSocket(socket);
            // Ask the backend to verify membership and join this game room.
            socket.emit('joinGameRoom', roomCode);
        });

        socket.on('gameRoomError', ({ message }) => {
            console.error('Game room error:', message);
        });

        socket.on('gameStateUpdated', (updatedRoom) => {
            console.log('Received updated game state:', updatedRoom.gameState);

            setRoom((previousRoom) => {
                if (!previousRoom) return previousRoom;

                return {
                    ...previousRoom,
                    ...updatedRoom,
                };
            });
        });

        socket.on('truthOrDareState', (updatedState) => {
            setRoom((previousRoom) => {
                if (!previousRoom) return previousRoom;

                return {
                    ...previousRoom,
                    truthOrDareState: updatedState,
                };
            });
        });

        socket.on('truthOrDareError', ({ message }) => {
            console.error('Truth or Dare error:', message);
        });


        socket.on('opponentLeftGame', ({ room: updatedRoom, leavingUserId }) => {
            const currentUser = JSON.parse(
                sessionStorage.getItem('user') || 'null'
            );

            const currentUserId = currentUser?.id || currentUser?._id;

            // Only update the screen of the player who did not leave.
            if (String(leavingUserId) === String(currentUserId)) {
                return;
            }

            setRoom((previousRoom) => {
                if (!previousRoom) return previousRoom;

                return {
                    ...previousRoom,
                    ...updatedRoom,
                };
            });

            setError('Your opponent has left the game.');
        });


        socket.on('connect_error', (error) => {
            console.error('Socket.IO connection failed:', error.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomCode, navigate]);



    useEffect(() => {
        const fetchRoom = async () => {
            const token = sessionStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/api/rooms/${roomCode}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Could not load room.');
                }

                setRoom(data.room);
            } catch (err) {
                setError(err.message || 'Unable to connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchRoom();
    }, [roomCode, navigate]);

    const handleMakeMove = async (cellIndex) => {
        const token = sessionStorage.getItem('token');

        if (!token || loadingMove) return;

        setLoadingMove(true);

        try {
            const response = await fetch(
                `${API_URL}/api/rooms/${roomCode}/move`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ cellIndex }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Could not make your move.');
            }

            // Update the current player's board immediately.
            setRoom((previousRoom) => ({
                ...previousRoom,
                ...data.room,
            }));
        } catch (error) {
            console.error('Move failed:', error.message);
            setError(error.message);
        } finally {
            setLoadingMove(false);
        }
    };


    const handleRequestRematch = async () => {
        const token = sessionStorage.getItem('token');

        if (!token || rematchLoading) return;

        setRematchLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/rooms/${roomCode}/rematch`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Could not request a rematch.');
            }

            setRoom((previousRoom) => ({
                ...previousRoom,
                ...data.room,
            }));
        } catch (error) {
            console.error('Rematch request failed:', error.message);
            setError(error.message);
        } finally {
            setRematchLoading(false);
        }
    };


    const handleLeaveGame = async () => {
        const token = sessionStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/rooms/${roomCode}/leave`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Could not leave the game.');
            }

            navigate('/dashboard');
        } catch (error) {
            console.error('Leave game failed:', error.message);
            setError(error.message);
        }
    };


    if (loading) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-container">
                    <section className="create-room-card">
                        <p>Loading room...</p>
                    </section>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-container">
                    <section className="create-room-card">
                        <h1>Unable to open room</h1>
                        <p>{error}</p>
                        <button
                            className="game-play-button"
                            onClick={() => navigate('/dashboard')}
                        >
                            Back to Lobby
                        </button>
                    </section>
                </div>
            </main>
        );
    }


    return (
        <main className="dashboard-page">
            <div className="dashboard-container">
                <section className="create-room-card">
                    <button
                        className="room-back-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Back to Lobby
                    </button>

                    <p className="lobby-eyebrow">DUOPLAY611 MULTIPLAYER</p>

                    <h1>{room.game}</h1>

                    <p className="lobby-description">
                        Your room is ready. Invite your friend and get ready to play!
                    </p>

                    <div className="room-preview">
                        <div>
                            <p className="lobby-eyebrow">ROOM CODE</p>
                            <h1>{room.roomCode}</h1>
                            <p>Status: {room.status}</p>
                        </div>
                    </div>

                    <div className="room-invite-section">
                        <h2>Players</h2>

                        {room.players.map((player) => (
                            <div
                                className="friend-card"
                                key={player._id}
                            >
                                <div className="friend-details">
                                    <h3>{player.username}</h3>
                                    <p className="auth-description">
                                        {room.host._id === player._id ? 'Host' : 'Player'}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {room.players.length < 2 && (
                            <p className="auth-description">
                                Waiting for another player to join...
                            </p>
                        )}

                        {room.game === 'Tic-Tac-Toe' && (
                            <TicTacToe
                                room={room}
                                onMakeMove={handleMakeMove}
                                currentUserId={
                                    JSON.parse(sessionStorage.getItem('user') || 'null')?.id ||
                                    JSON.parse(sessionStorage.getItem('user') || 'null')?._id
                                }
                                loadingMove={loadingMove}
                                onRequestRematch={handleRequestRematch}
                                rematchLoading={rematchLoading}
                                onLeaveGame={handleLeaveGame}
                            />
                        )}


                        {room.game === 'Truth or Dare' && (
                            <TruthOrDare
                                room={room}
                                socket={socket}
                                currentUserId={
                                    JSON.parse(sessionStorage.getItem('user') || 'null')?.id ||
                                    JSON.parse(sessionStorage.getItem('user') || 'null')?._id
                                }
                                onLeaveGame={handleLeaveGame}
                            />
                        )}


                    </div>
                </section>
            </div>
        </main>
    );
}
