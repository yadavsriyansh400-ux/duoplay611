
import Room from '../../models/Room.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDirectory = path.resolve(__dirname, '../../data');

function loadPrompts(filename) {
    const filePath = path.join(dataDirectory, filename);

    return fs
        .readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

const truthQuestions = loadPrompts('truthQuestions.txt');
const funDares = loadPrompts('funDares.txt');
const coupleDares = loadPrompts('coupleDares.txt');

// Select a random item from a list.
function getRandomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

// Get a random dare from the selected category.
function getDareByCategory(category) {
    if (category === 'fun') {
        return getRandomItem(funDares);
    }

    if (category === 'couple') {
        return getRandomItem(coupleDares);
    }

    if (category === 'spicy') {
        // Spicy uses the combined Fun + Couple dare pool.
        return getRandomItem([...funDares, ...coupleDares]);
    }

    return null;
}



export function registerTruthOrDareHandlers(io, socket) {
    // Find a random item that has not been used in this room yet.
    function getUnusedItem(items, usedItems) {
        const available = items.filter((item) => !usedItems.includes(item));

        // Start a fresh cycle if every item has been used.
        const pool = available.length > 0 ? available : items;

        return getRandomItem(pool);
    }

    // Validate the room and the connected player.
    async function getAuthorizedRoom(roomCode) {
        if (
            typeof roomCode !== 'string' ||
            !/^[A-F0-9]{6}$/i.test(roomCode.trim())
        ) {
            return null;
        }

        const normalizedCode = roomCode.trim().toUpperCase();

        const room = await Room.findOne({
            roomCode: normalizedCode,
            players: socket.userId,
            expiresAt: { $gt: new Date() },
        });

        if (!room || room.game !== 'Truth or Dare' || room.status !== 'playing') {
            return null;
        }

        return room;
    }

    // Send the current game state to both players.
    function broadcastState(room) {
        io.to(`room:${room.roomCode}`).emit('truthOrDareState', {
            roomCode: room.roomCode,
            players: room.players.map((player) => player.toString()),
            phase: room.truthOrDareState.phase,
            currentGiver: room.truthOrDareState.currentGiver?.toString() || null,
            turnType: room.truthOrDareState.turnType,
            selectedCategory: room.truthOrDareState.selectedCategory,
            currentPrompt: room.truthOrDareState.currentPrompt,
        });
    }

    // Send an error only to the player who made the request.
    function sendError(message) {
        socket.emit('truthOrDareError', { message });
    }

    // The current giver chooses Truth or Dare.
    socket.on('chooseTruthOrDare', async ({ roomCode, choice } = {}) => {
        try {
            if (!['truth', 'dare'].includes(choice)) {
                return sendError('Choose either Truth or Dare.');
            }

            const room = await getAuthorizedRoom(roomCode);

            if (!room) {
                return sendError('Room not found or you are not a player.');
            }

            const state = room.truthOrDareState;

            if (
                state.phase !== 'choosing' ||
                state.currentGiver?.toString() !== socket.userId
            ) {
                return sendError('It is not your turn to choose.');
            }

            state.turnType = choice;
            state.selectedCategory = null;

            if (choice === 'truth') {
                const question = getUnusedItem(
                    truthQuestions,
                    state.usedTruthQuestions
                );

                state.usedTruthQuestions.push(question);
                state.currentPrompt = question;
                state.phase = 'truth';
            } else {
                state.currentPrompt = '';
                state.phase = 'dare-category';
            }

            await room.save();
            broadcastState(room);
        } catch (error) {
            console.error('Choose Truth or Dare error:', error);
            sendError('Unable to select Truth or Dare.');
        }
    });

    // The giver chooses the dare category.
    socket.on('chooseDareCategory', async ({ roomCode, category } = {}) => {
        try {
            if (!['fun', 'couple', 'spicy'].includes(category)) {
                return sendError('Choose a valid dare category.');
            }

            const room = await getAuthorizedRoom(roomCode);

            if (!room) {
                return sendError('Room not found or you are not a player.');
            }

            const state = room.truthOrDareState;

            if (
                state.phase !== 'dare-category' ||
                state.turnType !== 'dare' ||
                state.currentGiver?.toString() !== socket.userId
            ) {
                return sendError('You cannot choose a category right now.');
            }

            const pool =
                category === 'fun'
                    ? funDares
                    : category === 'couple'
                        ? coupleDares
                        : [...funDares, ...coupleDares];

            const dare = getUnusedItem(pool, state.usedDares);

            state.selectedCategory = category;
            state.currentPrompt = dare;
            state.usedDares.push(dare);
            state.phase = 'dare';

            await room.save();
            broadcastState(room);
        } catch (error) {
            console.error('Choose dare category error:', error);
            sendError('Unable to select a dare.');
        }
    });

    // The player receiving the dare can request another one
    // from the same category.
    socket.on('rerollDare', async ({ roomCode } = {}) => {
        try {
            const room = await getAuthorizedRoom(roomCode);

            if (!room) {
                return sendError('Room not found or you are not a player.');
            }

            const state = room.truthOrDareState;
            const isTaker =
                state.currentGiver?.toString() !== socket.userId;

            if (state.phase !== 'dare' || !isTaker) {
                return sendError('Only the player receiving the dare can reroll.');
            }

            const pool =
                state.selectedCategory === 'fun'
                    ? funDares
                    : state.selectedCategory === 'couple'
                        ? coupleDares
                        : state.selectedCategory === 'spicy'
                            ? [...funDares, ...coupleDares]
                            : [];

            if (pool.length === 0) {
                return sendError('No valid dare category was selected.');
            }

            const dare = getUnusedItem(pool, state.usedDares);

            state.currentPrompt = dare;
            state.usedDares.push(dare);

            await room.save();
            broadcastState(room);
        } catch (error) {
            console.error('Reroll dare error:', error);
            sendError('Unable to reroll the dare.');
        }
    });


    socket.on('rerollTruth', async ({ roomCode } = {}) => {
        try {
            const room = await getAuthorizedRoom(roomCode);

            if (!room) {
                return sendError('Room not found or you are not a player.');
            }

            const state = room.truthOrDareState;
            const isTaker = state.currentGiver?.toString() !== socket.userId;

            if (state.phase !== 'truth' || !isTaker) {
                return sendError(
                    'Only the player receiving the truth question can reroll.'
                );
            }

            const question = getRandomItem(truthQuestions);

            state.currentPrompt = question;

            await room.save();
            broadcastState(room);
        } catch (error) {
            console.error('Reroll Truth error:', error);
            sendError('Unable to reroll the truth question.');
        }
    });


    // The player receiving the truth question or dare completes the turn.
    socket.on('completeTruthOrDareTurn', async ({ roomCode } = {}) => {
        try {
            const room = await getAuthorizedRoom(roomCode);

            if (!room) {
                return sendError('Room not found or you are not a player.');
            }

            const state = room.truthOrDareState;
            const isTaker =
                state.currentGiver?.toString() !== socket.userId;

            if (!['truth', 'dare'].includes(state.phase) || !isTaker) {
                return sendError('Only the player receiving the prompt can finish the turn.');
            }

            const playerIds = room.players.map((player) => player.toString());

            if (playerIds.length !== 2) {
                return sendError('This game requires exactly two players.');
            }

            // Switch the giver to the other player.
            state.currentGiver = playerIds.find(
                (playerId) => playerId !== state.currentGiver.toString()
            );

            state.phase = 'choosing';
            state.turnType = null;
            state.selectedCategory = null;
            state.currentPrompt = '';

            await room.save();
            broadcastState(room);
        } catch (error) {
            console.error('Complete Truth or Dare turn error:', error);
            sendError('Unable to complete the turn.');
        }
    });
}


