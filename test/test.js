const firebase = require('@firebase/testing');
const fs = require('fs');

/*
 * ============
 *    Setup
 * ============
 */
const projectId = 'nuxt-blueprint';
const firebasePort = require('../firebase.json').emulators.firestore.port;
const port = firebasePort /** Exists? */ ? firebasePort : 8080;
const coverageUrl = `http://localhost:${port}/emulator/v1/projects/${projectId}:ruleCoverage.html`;

const rules = fs.readFileSync('firestore.rules', 'utf8');

/**
 * Creates a new app with authentication data matching the input.
 *
 * @param {object} auth the object to use for authentication (typically {uid: some-uid})
 * @return {object} the app.
 */
function authedApp(auth) {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
}

function adminApp() {
  return firebase.initializeAdminApp({projectId}).firestore();
}

const userId = 'Jnwgqjb6boXIufreAcuDyMzKU3s2'
const userId2 = 'Jnwg22'

const db = authedApp({ uid: userId })
const profile = db.collection('user').doc(userId);
const profile2 = db.collection('user').doc(userId2);

/*
 * ============
 *  Test Cases
 * ============
 */
beforeEach(async () => {
  // Clear the database between tests
  await firebase.clearFirestoreData({ projectId });
});

before(async () => {
  await firebase.loadFirestoreRules({ projectId, rules });

  let db = adminApp({ uid: userId });

  await db.collection('user').doc(userId).set({
    id: userId,
    amountOfMoney: "600",
    billEmail: "test@mail.com",
    childrenIds: [],
    creditLimit: 0,
    email: "test@mail.com",
    isActive: true,
    name: "Test",
    role: "user",
    surname: "Test",
  });
});

after(async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
  console.log(`View rule coverage information at ${coverageUrl}\n`);
});

describe('My app', () => {
  it('require users to log in before creating a profile', async () => {
    const db = authedApp(null);
    const profile = db.collection('user').doc(userId);
  });
});

describe('When user logined he can:', () => {

  it('Can read themself', async () => {
    await firebase.assertSucceeds(profile.get());
  });

  it('Can not read other user', async () => {
    await firebase.assertFails(profile2.get());
  });

  it('Can change: name, surname, billEmail, creditLimit', async () => {
    await firebase.assertSucceeds(profile.set({ name: 'New name' }, { merge: true }));
    await firebase.assertSucceeds(profile.set({ surname: 'New surname' }, { merge: true }));
    await firebase.assertSucceeds(profile.set({ billEmail: 'new-email@gmail.com' }, { merge: true }));
    await firebase.assertSucceeds(profile.set({ creditLimit: 10 }, { merge: true }));
  });

  it('Can not change: id. email, amountOfMoney', async () => {
    await firebase.assertFails(profile.set({ email: 'test2@gmail.com' }, { merge: true }));
    await firebase.assertFails(profile.set({ id: userId }, { merge: true }));
    await firebase.assertFails(profile.set({ amountOfMoney: 44 }, { merge: true }));
  });
});