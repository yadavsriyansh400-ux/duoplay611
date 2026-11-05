import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import RegisterPage from './pages/Register.jsx';
import VerifyEmailPage from './pages/VerifyEmail.jsx';
import LoginPage from './pages/Login.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import { useState, useEffect } from 'react';
import CreateRoom from './pages/CreateRoom.jsx';
import RoomPage from './pages/RoomPage.jsx';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from "./config";

function Home() {
  return (
    <div className="app">
      <nav className="navbar">
        <a href="/" className="logo">
          <span className="logo-icon">D</span>
          <span>DuoPlay<span className="logo-accent">611</span></span>
        </a>

        <div className="nav-links">
          <a href="#games">Games</a>
          <a href="#canvas">Duo Canvas</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost">
            Log in
          </Link>

          <Link to="/register" className="btn btn-primary">
            Get started <span>↗</span>
          </Link>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />

          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot" />
              TWO PLAYERS. INFINITE FUN.
            </div>

            <h1>
              Your next favorite
              <br />
              game is <span className="gradient-text">together.</span>
            </h1>

            <p className="hero-description">
              Challenge your friends, draw together, and turn
              every little moment into a fun competition.
            </p>

            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-large">
                Start playing <span>→</span>
              </Link>
              <a href="#games" className="explore-link">
                Explore games <span>↓</span>
              </a>
            </div>

            <div className="hero-note">
              <span className="avatar-stack">
                <span>🎮</span>
                <span>🎨</span>
                <span>⚡</span>
              </span>
              <span>Made for friends, built for fun.</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="visual-header">
                <div>
                  <span className="live-dot" />
                  <span>FRIENDLY MATCH</span>
                </div>
                <span className="match-tag">01 / 01</span>
              </div>

              <div className="players">
                <div className="player">
                  <div className="player-avatar avatar-purple">✦</div>
                  <span>Player One</span>
                  <small>YOUR MOVE</small>
                </div>

                <div className="versus">VS</div>

                <div className="player">
                  <div className="player-avatar avatar-cyan">✧</div>
                  <span>Player Two</span>
                  <small>READY</small>
                </div>
              </div>

              <div className="tic-board" aria-label="Decorative tic-tac-toe preview">
                {['X', 'O', '', 'O', 'X', '', '', 'O', 'X'].map(
                  (cell, index) => (
                    <div
                      className={`tic-cell ${cell === 'X' ? 'cell-x' : cell === 'O' ? 'cell-o' : ''
                        }`}
                      key={index}
                    >
                      {cell}
                    </div>
                  )
                )}
              </div>

              <div className="visual-footer">
                <span><span className="status-dot" /> ROOM ACTIVE</span>
                <span>LET'S PLAY <span className="footer-arrow">↗</span></span>
              </div>
            </div>

            <div className="floating-chip chip-top">✦ Play together</div>
            <div className="floating-chip chip-bottom">⚡ Real-time fun</div>
          </div>
        </section>

        <section className="games-section" id="games">
          <div className="section-heading">
            <div>
              <span className="section-kicker">PICK YOUR PLAY</span>
              <h2>Small games. <span>Big fun.</span></h2>
            </div>
            <p>Four ways to challenge your favorite person.</p>
          </div>

          <div className="games-grid">
            <article className="game-card game-tic">
              <div className="game-card-top">
                <span className="game-icon">✕</span>
                <span className="game-number">01</span>
              </div>
              <div className="game-art tic-art">X <span>O</span> X</div>
              <div className="game-info">
                <div>
                  <h3>Tic-Tac-Toe</h3>
                  <p>A classic battle of wits.</p>
                </div>
                <span className="game-arrow">↗</span>
              </div>
            </article>

            <article className="game-card game-connect">
              <div className="game-card-top">
                <span className="game-icon">⊞</span>
                <span className="game-number">02</span>
              </div>
              <div className="game-art connect-art">
                <span>●</span><span>●</span><span>●</span>
                <span>●</span><span>●</span><span>●</span>
              </div>
              <div className="game-info">
                <div>
                  <h3>Connect Four</h3>
                  <p>Line up four to win.</p>
                </div>
                <span className="game-arrow">↗</span>
              </div>
            </article>

            <article className="game-card game-guess">
              <div className="game-card-top">
                <span className="game-icon">?</span>
                <span className="game-number">03</span>
              </div>
              <div className="game-art guess-art">
                <span>?</span>
                <div>GUESS THE NUMBER</div>
              </div>
              <div className="game-info">
                <div>
                  <h3>Guess My Number</h3>
                  <p>Can you read their mind?</p>
                </div>
                <span className="game-arrow">↗</span>
              </div>
            </article>

            <article className="game-card game-truth">
              <div className="game-card-top">
                <span className="game-icon">♡</span>
                <span className="game-number">04</span>
              </div>
              <div className="game-art truth-art">
                <span>TRUTH</span>
                <span>OR</span>
                <span>DARE</span>
              </div>
              <div className="game-info">
                <div>
                  <h3>Truth or Dare</h3>
                  <p>Make every turn interesting.</p>
                </div>
                <span className="game-arrow">↗</span>
              </div>
            </article>
          </div>
        </section>

        <section className="canvas-banner" id="canvas">
          <div className="canvas-copy">
            <span className="section-kicker">YOUR SHARED SPACE</span>
            <h2>Two sides. <span>One canvas.</span></h2>
            <p>
              Doodle, sketch, and create together in real time.
              Your next masterpiece starts with a single stroke.
            </p>
            <button className="btn btn-primary">
              Discover Duo Canvas <span>→</span>
            </button>
          </div>
          <div className="canvas-preview">
            <div className="canvas-half canvas-left">
              <span className="canvas-label">PLAYER 01</span>
              <span className="doodle doodle-star">✳</span>
              <span className="doodle doodle-wave">〰</span>
            </div>
            <div className="canvas-divider"><span>↔</span></div>
            <div className="canvas-half canvas-right">
              <span className="canvas-label">PLAYER 02</span>
              <span className="doodle doodle-heart">♡</span>
              <span className="doodle doodle-spark">✦</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" id="about">
        <a href="/" className="logo">
          <span className="logo-icon">D</span>
          <span>DuoPlay<span className="logo-accent">611</span></span>
        </a>
        <p>Less scrolling. More playing.</p>
        <span className="footer-copy">© 2026 DuoPlay611</span>
      </footer>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

  const [playerId, setPlayerId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [incomingRequests, setIncomingRequests] = useState([]);

  const [roomInvitations, setRoomInvitations] = useState([]);
  const [roomInvitationsLoading, setRoomInvitationsLoading] = useState(false);
  const [roomInvitationMessage, setRoomInvitationMessage] = useState('');

  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsMessage, setRequestsMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsMessage, setFriendsMessage] = useState('');

  const fetchIncomingRequests = async () => {
    setRequestsLoading(true);
    setRequestsMessage('');

    try {
      const response = await fetch(
        `${API_URL}/api/friend-requests/incoming`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRequestsMessage(
          data.message || 'Unable to load friend requests.'
        );
        return;
      }

      setIncomingRequests(data.requests || []);
    } catch (error) {
      setRequestsMessage(
        'Could not connect to the server. Please try again.'
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchFriends = async () => {
    const token = sessionStorage.getItem('token');

    if (!token) {
      setFriendsMessage('Please log in to view your friends.');
      return;
    }

    setFriendsLoading(true);
    setFriendsMessage('');

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

      if (!data.friends || data.friends.length === 0) {
        setFriendsMessage('No friends yet. Send a friend request to get started!');
      }
    } catch (error) {
      setFriendsMessage(error.message || 'Unable to load friends right now.');
    } finally {
      setFriendsLoading(false);
    }
  };


  const fetchRoomInvitations = async () => {
    setRoomInvitationsLoading(true);
    setRoomInvitationMessage('');

    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `${API_URL}/api/rooms/invitations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to load room invitations.'
        );
      }

      setRoomInvitations(data.invitations || []);
    } catch (error) {
      setRoomInvitationMessage(
        error.message || 'Unable to load room invitations.'
      );
    } finally {
      setRoomInvitationsLoading(false);
    }
  };

  const respondToRoomInvitation = async (invitationId, action) => {
    setRoomInvitationMessage('');

    try {
      const response = await fetch(
        `${API_URL}/api/rooms/invitations/respond`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
          body: JSON.stringify({ invitationId, action }),
        }
      );

      const data = await response.json();
      console.log('Invitation response : ', data);
      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to process room invitation.'
        );
      }

      setRoomInvitations((previous) =>
        previous.filter(
          (invitation) =>
            (invitation._id || invitation.id) !== invitationId
        )
      );

      setRoomInvitationMessage(data.message || 'Invitation updated.');

      if (action === 'accepted' && data.room?.roomCode) {
        navigate(`/room/${data.room.roomCode}`);
      } else if (action === 'accepted') {
        console.error('Accepted invitation, but room code is missing:', data);
      }
    } catch (error) {
      setRoomInvitationMessage(
        error.message || 'Could not process the invitation.'
      );
    }
  };

  const respondToRequest = async (requestId, action) => {
    setRequestsMessage('');

    try {
      const response = await fetch(
        `${API_URL}/api/friend-requests/respond`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
          body: JSON.stringify({ requestId, action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRequestsMessage(data.message || 'Unable to update request.');
        return;
      }

      setRequestsMessage(data.message);
      await fetchIncomingRequests();
    } catch (error) {
      setRequestsMessage(
        'Could not connect to the server. Please try again.'
      );
    }
  };

  useEffect(() => {
    fetchIncomingRequests();
    fetchFriends();
    fetchRoomInvitations();
  }, []);


  useEffect(() => {
    const token = sessionStorage.getItem('token');

    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socket.on('newRoomInvitation', () => {
      fetchRoomInvitations();
    });

    return () => {
      socket.disconnect();
    };
  }, []);


  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <main className="dashboard-page.">

      <header className="lobby-navbar">
        <a className="lobby-brand" href="/dashboard">
          <span className="lobby-brand-icon">D</span>
          <span>DuoPlay<span className="brand-accent">611</span></span>
        </a>

        <nav className="lobby-nav-links">
          <a href="#games">Games</a>
          <a href="#my-friends">Friends</a>
          <a href="#my-profile">My Profile</a>
        </nav>

        <button
          type="button"
          className="lobby-logout"
          onClick={handleLogout}
        >
          Log out ↗
        </button>
      </header>

      <div className="dashboard-container">

        <section className="game-lobby" id="games">

          <div className="lobby-heading">
            <div className="lobby-heading-text">
              <p className="lobby-eyebrow">YOUR PLAYGROUND</p>
              <h2>Small games. <span>Big fun.</span></h2>
              <p className="lobby-description">
                Pick a game, invite your friends, and let the fun begin.
              </p>
            </div>

            <div className="mini-profile-card">
              <div className="mini-profile-top">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="mini-profile-avatar"
                  />
                ) : (
                  <div className="mini-profile-avatar mini-profile-initial">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}

                <div className="mini-profile-info">
                  <h3 className="mini-profile-username">
                    {user?.username || 'Player'}
                    {user?.isVerified && (
                      <span className="verified-tick" title="Verified account">✓</span>
                    )}
                  </h3>
                  <p>YOUR PROFILE</p>
                </div>
              </div>

              <div className="mini-profile-id">
                <span>PLAYER ID</span>
                <strong>{user?.playerId || 'Not available'}</strong>
              </div>

              <button
                type="button"
                className="mini-profile-button"
                onClick={() => document.getElementById('my-profile')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Profile <span>↗</span>
              </button>
            </div>
          </div>


          <div className="game-grid">
            <article className="game-card">
              <div className="game-card-top">
                <span className="game-icon">✕</span>
                <span className="game-number">01</span>
              </div>
              <div className="game-preview tic-tac-toe-preview">X <span>O</span> X</div>
              <h3>Tic-Tac-Toe</h3>
              <p>A classic battle of wits.</p>
              <button
                type="button"
                className="game-play-button"
                onClick={() => navigate('/create-room?game=Tic-Tac-Toe')}
              >
                Play <span>↗</span>
              </button>
            </article>

            <article className="game-card">
              <div className="game-card-top">
                <span className="game-icon">▦</span>
                <span className="game-number">02</span>
              </div>

              <div className="game-preview connect-preview">
                <div className="connect-row"><span>●</span><span>●</span><span>●</span></div>
                <div className="connect-row"><span>●</span><span>●</span><span>●</span></div>
                <div className="connect-row"><span>●</span><span>●</span><span>●</span></div>
              </div>

              <h3>Connect Four</h3>
              <p>Line up four to win.</p>
              <button
                type="button"
                className="game-play-button"
                onClick={() => navigate('/create-room?game=Connect%20Four')}
              >
                Play <span>↗</span>
              </button>
            </article>

            <article className="game-card">
              <div className="game-card-top">
                <span className="game-icon">?</span>
                <span className="game-number">03</span>
              </div>
              <div className="game-preview guess-preview">?</div>
              <h3>Guess My Number</h3>
              <p>Can you guess the number?</p>
              <button
                type="button"
                className="game-play-button"
                onClick={() => navigate('/create-room?game=Guess%20My%20Number')}
              >
                Play <span>↗</span>
              </button>
            </article>

            <article className="game-card">
              <div className="game-card-top">
                <span className="game-icon">♡</span>
                <span className="game-number">04</span>
              </div>
              <div className="game-preview truth-preview">TRUTH <span>OR</span> DARE</div>
              <h3>Truth or Dare</h3>
              <p>Make every turn interesting.</p>
              <button
                type="button"
                className="game-play-button"
                onClick={() => navigate('/create-room?game=Truth%20or%20Dare')}
              >
                Play <span>↗</span>
              </button>
            </article>


            <article className="game-card">
              <div className="game-card-top">
                <span className="game-icon">✎</span>
                <span className="game-number">05</span>
              </div>

              <div className="game-preview shared-canvas-preview">
                <span>✎</span>
                <span className="canvas-preview-line"></span>
                <span className="canvas-preview-dot"></span>
              </div>

              <h3>Shared Canvas</h3>
              <p>Draw together and bring your ideas to life.</p>

              <button
                type="button"
                className="game-play-button"
                onClick={() => navigate('/create-room?game=Shared%20Canvas')}
              >
                Play <span>↗</span>
              </button>
            </article>


            <article className="game-card coming-soon-card">
              <div className="game-card-top">
                <span className="game-icon">✦</span>
                <span className="game-number">05</span>
              </div>
              <div className="game-preview coming-soon-preview">
                <span>MORE</span>
                <span>GAMES</span>
                <span>COMING SOON</span>
              </div>
              <h3>More Games Incoming</h3>
              <p>More ways to play are on the way.</p>
              <span className="coming-soon-label">STAY TUNED ✦</span>
            </article>
          </div>
        </section>

        <div className="friends-layout" id="my-friends">
          <div className="friends-left-column">
            <div className="find-players friends-action-card">
              <h2>Find Players</h2>
              <p className="auth-description">
                Find players using their Player ID and send friend requests.
              </p>


              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  setSearchResult(null);
                  setSearchMessage('');
                  setSearching(true);

                  try {
                    const response = await fetch(
                      `${API_URL}/api/players/search?playerId=${encodeURIComponent(playerId)}`,
                      {
                        headers: {
                          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                        },
                      }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                      setSearchMessage(data.message || 'Player search failed.');
                    } else {
                      setSearchResult(data.player);
                    }
                  } catch (error) {
                    setSearchMessage('Could not connect to the server. Please try again.');
                  } finally {
                    setSearching(false);
                  }
                }}
              >
                <input
                  type="text"
                  name="playerId"
                  placeholder="Enter Player ID"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  disabled={searching}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {searchMessage && (
                <p className="search-message">
                  {searchMessage}
                </p>
              )}

              {searchResult && (
                <div className="search-player-card">
                  {searchResult.profilePicture ? (
                    <img
                      className="player-avatar"
                      src={searchResult.profilePicture}
                      alt="Player profile"
                    />
                  ) : (
                    <div className="player-avatar player-avatar-placeholder">
                      {searchResult.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}

                  <h3>{searchResult.username}</h3>
                  <p className="auth-description">
                    Player ID: {searchResult.playerId}
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary auth-submit"
                    onClick={async () => {
                      setRequestMessage('');

                      try {
                        const response = await fetch(
                          `${API_URL}/api/friend-requests/send`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                            },
                            body: JSON.stringify({
                              playerId: searchResult.playerId,
                            }),
                          }
                        );

                        const data = await response.json();
                        setRequestMessage(data.message || 'Request completed.');
                      } catch (error) {
                        setRequestMessage(
                          'Could not connect to the server. Please try again.'
                        );
                      }
                    }}
                  >
                    Send Friend Request
                  </button>

                  {requestMessage && (
                    <p className="search-message">{requestMessage}</p>
                  )}

                </div>
              )}

            </div>

            <div className="incoming-requests">
              <h2>Incoming Friend Requests</h2>

              {requestsLoading && (
                <p className="auth-description">Loading requests...</p>
              )}

              {requestsMessage && (
                <p className="search-message">{requestsMessage}</p>
              )}

              {!requestsLoading &&
                !requestsMessage &&
                incomingRequests.length === 0 && (
                  <p className="auth-description">
                    No pending friend requests.
                  </p>
                )}

              {incomingRequests.map((request) => (
                <div className="incoming-request-card" key={request.id}>
                  {request.sender?.profilePicture ? (
                    <img
                      className="player-avatar"
                      src={request.sender.profilePicture}
                      alt="Sender profile"
                    />
                  ) : (
                    <div className="player-avatar player-avatar-placeholder">
                      {request.sender?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}

                  <h3>{request.sender?.username || 'Player'}</h3>

                  <p className="auth-description">
                    Player ID: {request.sender?.playerId || 'Not available'}
                  </p>

                  <p className="auth-description">Wants to be your friend!</p>

                  <div className="request-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => respondToRequest(request.id, 'accepted')}
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => respondToRequest(request.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>


          <div className="incoming-requests">
            <h2>Incoming Room Invitations</h2>

            {roomInvitationsLoading && (
              <p className="auth-description">Loading room invitations...</p>
            )}

            {roomInvitationMessage && (
              <p className="search-message" role="status">
                {roomInvitationMessage}
              </p>
            )}

            {!roomInvitationsLoading &&
              roomInvitations.length === 0 &&
              !roomInvitationMessage && (
                <p className="auth-description">
                  No pending room invitations.
                </p>
              )}

            {roomInvitations.map((invitation) => {
              const invitationId = invitation._id || invitation.id;

              return (
                <div className="incoming-request-card" key={invitationId}>
                  <h3>
                    {invitation.sender?.username || 'A friend'} invited you!
                  </h3>

                  <p className="auth-description">
                    Game: {invitation.room?.game || 'Unknown game'}
                  </p>

                  <p className="auth-description">
                    Room code: {invitation.room?.roomCode || 'Unavailable'}
                  </p>

                  <div className="request-actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        respondToRoomInvitation(invitationId, 'accepted')
                      }
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        respondToRoomInvitation(invitationId, 'rejected')
                      }
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>


          <div className="my-friends frinds-right-column">
            <h2>My Friends</h2>

            {friendsLoading && (
              <p className="auth-description">Loading friends...</p>
            )}

            {!friendsLoading && friends.length === 0 && (
              <p className="auth-description">
                {friendsMessage || 'No friends yet. Send a friend request to get started!'}
              </p>
            )}

            {!friendsLoading && friends.length > 0 && (
              <div className="friends-list">
                {friends.map((friend) => (
                  <div className="friend-card" key={friend._id}>
                    {friend.profilePicture ? (
                      <img
                        src={friend.profilePicture}
                        alt={friend.username}
                        className="friend-avatar"
                      />
                    ) : (
                      <div className="friend-avatar-placeholder">
                        {friend.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}

                    <div className="friend-details">
                      <h3>{friend.username}</h3>
                      <p className="auth-description">
                        Player ID: {friend.playerId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          className="btn btn-primary auth-submit"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </main>
  );
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
      </Route>

      <Route
        path="/create-room"
        element={
          <ProtectedRoute>
            <CreateRoom />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
