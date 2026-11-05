
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../App.css';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from "../config";

export default function CreateRoom() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const games = [
        'Tic-Tac-Toe',
        'Connect Four',
        'Guess My Number',
        'Truth or Dare',
        'Shared Canvas',
    ];

    const requestedGame = searchParams.get('game');

    const [selectedGame, setSelectedGame] = useState(
        games.includes(requestedGame) ? requestedGame : 'Tic-Tac-Toe'
    );

    const gameWasSelected = games.includes(requestedGame);
    const [createdRoom, setCreatedRoom] = useState(null);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [invitingFriendId, setInvitingFriendId] = useState(null);
    const [invitationMessages, setInvitationMessages] = useState({});

    useEffect(() => {
        const storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
        const userId = storedUser?._id || storedUser?.id;

        if (!userId) {
            console.error('Could not find the logged-in user ID:', storedUser);
            return;
        }

        const token = sessionStorage.getItem('token');

        const socket = io(SOCKET_URL, {
            auth: {
                token,
            },
        });

        socket.on('connect', () => {
            console.log('Host connected to Socket.IO:', socket.id);
        });

        socket.on('friendJoinedRoom', ({ roomCode }) => {
            if (roomCode) {
                navigate(`/room/${roomCode}`);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [navigate]);

    useEffect(() => {
        const fetchFriends = async () => {
            const token = sessionStorage.getItem('token');

            if (!token) {
                setFriendsLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/api/friend-requests/friends`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Unable to load friends.');
                }

                setFriends(data.friends || []);
            } catch (error) {
                console.error('Fetch friends error:', error);
            } finally {
                setFriendsLoading(false);
            }
        };

        fetchFriends();
    }, []);

    const handleCreateRoom = async () => {
        try {
            const token = sessionStorage.getItem('token');

            if (!token) {
                alert('Please log in before creating a room.');
                navigate('/login');
                return;
            }

            const response = await fetch(`${API_URL}/api/rooms/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ game: selectedGame }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Failed to create room.');
                return;
            }

            setCreatedRoom(data.room);
        } catch (error) {
            console.error('Create room error:', error);
            alert('Could not connect to the server. Please try again.');
        }
    };


    const handleInviteFriend = async (friend) => {
        if (!createdRoom?.id) {
            alert('Please create a room first.');
            return;
        }

        const token = sessionStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        const friendId = friend._id || friend.id;

        if (!friendId) {
            setInvitationMessages((previous) => ({
                ...previous,
                [friendId || friend.username]: 'Could not identify this friend.',
            }));
            return;
        }

        setInvitingFriendId(friendId);
        setInvitationMessages((previous) => ({
            ...previous,
            [friendId]: '',
        }));

        try {
            const response = await fetch(`${API_URL}/api/rooms/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomId: createdRoom.id,
                    friendId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send invitation.');
            }

            setInvitationMessages((previous) => ({
                ...previous,
                [friendId]: 'Invitation sent successfully!',
            }));
        } catch (error) {
            setInvitationMessages((previous) => ({
                ...previous,
                [friendId]: error.message || 'Could not send invitation.',
            }));
        } finally {
            setInvitingFriendId(null);
        }
    };

    return (
        <main className="dashboard-page">
            <div className="dashboard-container">
                <section className="create-room-card">
                    <button
                        type="button"
                        className="room-back-button"
                        onClick={() => navigate('/dashboard')}
                    >
                        ← Back to Lobby
                    </button>

                    <p className="lobby-eyebrow">DUOPLAY611 MULTIPLAYER</p>
                    <h1>Create a Room</h1>
                    <p className="lobby-description">
                        Choose a game and create a private space for your friends.
                    </p>

                    {!gameWasSelected && (
                        <>
                            <label className="room-field-label" htmlFor="game-select">
                                Choose your game
                            </label>

                            <select
                                id="game-select"
                                className="room-game-select"
                                value={selectedGame}
                                onChange={(e) => setSelectedGame(e.target.value)}
                            >
                                {games.map((game) => (
                                    <option key={game} value={game}>
                                        {game}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}

                    <div className="room-preview">
                        <span className="room-preview-icon">🎮</span>
                        <div>
                            <h2>{selectedGame}</h2>
                            <p>A private room for you and your friends.</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="game-play-button create-room-button"
                        onClick={handleCreateRoom}
                    >
                        Create Room <span>↗</span>
                    </button>
                    {createdRoom && (
                        <div className="room-preview">
                            <p className="lobby-eyebrow">ROOM CREATED SUCCESSFULLY</p>

                            <h2>{createdRoom.game}</h2>

                            <p>Your room code is:</p>

                            <h1>{createdRoom.roomCode}</h1>

                            <p>Share this code with your friend so they can join.</p>

                            <p>Waiting for your friend to join...</p>
                            <div className="room-invite-section">
                                <h2>Invite a Friend</h2>

                                {friendsLoading ? (
                                    <p className="auth-description">Loading friends...</p>
                                ) : friends.length === 0 ? (
                                    <p className="auth-description">
                                        You don't have any accepted friends yet.
                                    </p>
                                ) : (
                                    <div className="friends-list">
                                        {friends.map((friend) => (
                                            <div className="friend-card" key={friend._id || friend.id}>
                                                <div className="friend-details">
                                                    <h3>{friend.username}</h3>
                                                    <p className="auth-description">
                                                        Player ID: {friend.playerId}
                                                    </p>
                                                </div>


                                                <div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        disabled={invitingFriendId === (friend._id || friend.id)}
                                                        onClick={() => handleInviteFriend(friend)}
                                                    >
                                                        {invitingFriendId === (friend._id || friend.id)
                                                            ? 'Sending...'
                                                            : 'Invite'}
                                                    </button>

                                                    {invitationMessages[friend._id || friend.id] && (
                                                        <p className="auth-description" role="status">
                                                            {invitationMessages[friend._id || friend.id]}
                                                        </p>
                                                    )}
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
