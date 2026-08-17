// In-memory store — production runtime data
// Users are created dynamically via Clerk sync or registration
const { v4: uuidv4 } = require('uuid');

const mockDB = {
  users: [],
  quizzes: [],
  attempts: [],
  flashcards: [],
  studyPlans: [],
  teams: [],
  certificates: [],
  battleRooms: new Map()
};

module.exports = { mockDB };
