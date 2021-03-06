import Alert from 'react-s-alert';
import { expectSaga } from 'redux-saga-test-plan';
import { APIResponse, APIError } from 'util/API';
import { history } from 'modules/LocationModule';
import { userState, resetState } from 'modules/StateModule';
import {
  fetchUser,
  fetchUserPending,
  fetchUserFulfilled,
  fetchUserRejected,
  signOutUser,
  resetUserState,
} from 'modules/UserModule';
import saga, {
  fetchUserWorker,
  signOutUserWorker,
  resetUserStateWorker,
  userSaga,
} from 'sagas/UserSaga';
import UserAPI from 'apis/UserAPI';
import config from 'config/index';

describe('(Saga) UserSaga', () => {
  const errorResponse = new APIResponse('auth.unauthorized', 'You don\'t have permission to access this endpoint!');
  const successResponse = new APIResponse('successful', 'Successful response');
  const unauthorizedError = new APIError(errorResponse);
  const fatalError = new APIError(new APIResponse('error', 'Error response'));

  it('Should export the wired saga', () => {
    expect(saga).to.be.a('array');
    expect(saga[0]).to.equal(userSaga);
    expect(saga[1]).to.eql(new UserAPI());
  });

  describe('(Generator) fetchUserWorker', () => {
    it('Should be exported as a generator function', () => {
      expect(fetchUserWorker[Symbol.toStringTag]).to.equal('GeneratorFunction');
    });

    it('Should set the state to pending', () => {
      const api = { get: () => successResponse };
      return expectSaga(fetchUserWorker, api)
        .put(fetchUserPending())
        .dispatch(fetchUser())
        .run({ silenceTimeout: true });
    });

    it('Should call the `user` method of the API', () => {
      const api = { get: () => successResponse };
      return expectSaga(fetchUserWorker, api)
        .call([api, api.get])
        .dispatch(fetchUser())
        .run({ silenceTimeout: true });
    });

    it('Should set the state to fulfilled if the call to the API was successful', () => {
      const api = { get: () => successResponse };
      return expectSaga(fetchUserWorker, api)
        .put(fetchUserFulfilled(successResponse.details))
        .dispatch(fetchUser())
        .run({ silenceTimeout: true });
    });

    it('Should set the state to rejected if the call to the API failed', () => {
      const api = { get: () => { throw fatalError; } };
      return expectSaga(fetchUserWorker, api)
        .put(fetchUserRejected(fatalError))
        .dispatch(fetchUser())
        .run({ silenceTimeout: true });
    });

    it('Should reset the user state on error', () => {
      const api = { get: () => { throw fatalError; } };
      return expectSaga(fetchUserWorker, api)
        .put(resetUserState())
        .dispatch(fetchUser())
        .run({ silenceTimeout: true });
    });
  });

  describe('(Generator) signOutUserWorker', () => {
    it('Should be exported as a generator function', () => {
      expect(signOutUserWorker[Symbol.toStringTag]).to.equal('GeneratorFunction');
    });

    it('Should call the `signOut` method of the API', () => {
      const api = { signOut: () => successResponse };
      return expectSaga(signOutUserWorker, api)
        .call([api, api.signOut])
        .dispatch(signOutUser())
        .run({ silenceTimeout: true });
    });

    it('Should reset the user state on success', () => {
      const api = { signOut: () => successResponse };
      return expectSaga(signOutUserWorker, api)
        .put(resetUserState())
        .dispatch(signOutUser())
        .run({ silenceTimeout: true });
    });

    it('Should route to the sign-in page on success', () => {
      const api = { signOut: () => successResponse };
      return expectSaga(signOutUserWorker, api)
        .call(history.push, config.route.auth.signIn)
        .dispatch(signOutUser())
        .run({ silenceTimeout: true });
    });

    it('Should reset the user if the user is unauthorized', () => {
      const api = { signOut: () => { throw unauthorizedError; } };
      return expectSaga(signOutUserWorker, api)
        .put(resetUserState())
        .dispatch(signOutUser())
        .run({ silenceTimeout: true });
    });

    it('Should route to the sign-in page if the user is unauthorized', () => {
      const api = { signOut: () => { throw unauthorizedError; } };
      return expectSaga(signOutUserWorker, api)
        .call(history.push, config.route.auth.signIn)
        .dispatch(signOutUser())
        .run({ silenceTimeout: true });
    });

    it('Should display the error alert box on error', () => {
      const api = { signOut: () => { throw fatalError; } };
      return expectSaga(signOutUserWorker, api)
        .call(Alert.error, fatalError.response.description)
        .dispatch(signOutUser())
        .run({ silenceTimeout: true });
    });
  });

  describe('(Generator) resetUserStateWorker', () => {
    it('Should be exported as a generator function', () => {
      expect(resetUserStateWorker[Symbol.toStringTag]).to.equal('GeneratorFunction');
    });

    it('Should reset the state for the given keys', () =>
      expectSaga(resetUserStateWorker)
        .put(resetState(userState))
        .dispatch(resetUserState())
        .run({ silenceTimeout: true }));
  });

  describe('(Generator) userSaga', () => {
    it('Should be exported as a generator function', () => {
      expect(userSaga[Symbol.toStringTag]).to.equal('GeneratorFunction');
    });

    it('Should spawn all workers', () => {
      const api = {};
      return expectSaga(userSaga, api)
        .spawn(fetchUserWorker, api)
        .spawn(signOutUserWorker, api)
        .spawn(resetUserStateWorker)
        .run({ silenceTimeout: true });
    });
  });
});
