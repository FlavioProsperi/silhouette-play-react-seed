import { expectSaga } from 'redux-saga-test-plan';
import saga, { fetchCatalogWorker, i18nSaga } from 'sagas/I18nSaga';
import {
  fetchCatalog,
  fetchCatalogPending,
  fetchCatalogFulfilled,
  fetchCatalogRejected,
} from 'modules/I18nModule';
import I18nAPI from 'apis/I18nAPI';

describe('(Saga) I18nSaga', () => {
  const catalog = { Save: 'Speichern' };

  it('Should export the wired saga', () => {
    expect(saga).to.be.a('array');
    expect(saga[0]).to.equal(i18nSaga);
    expect(saga[1]).to.eql(new I18nAPI());
  });

  describe('(Generator) fetchCatalogWorker', () => {
    it('Should be exported as a generator function', () => {
      expect(fetchCatalogWorker[Symbol.toStringTag]).to.equal('GeneratorFunction');
    });

    it('Should set the state to pending', () => {
      const api = { fetchCatalog: () => catalog };
      return expectSaga(fetchCatalogWorker, api)
        .put(fetchCatalogPending())
        .dispatch(fetchCatalog('de'))
        .run({ silenceTimeout: true });
    });

    it('Should set the state to fulfilled if the call to the API was successful', () => {
      const api = { fetchCatalog: () => catalog };
      return expectSaga(fetchCatalogWorker, api)
        .put(fetchCatalogFulfilled(catalog))
        .dispatch(fetchCatalog('de'))
        .run({ silenceTimeout: true });
    });

    it('Should set the state to rejected if the call to the API failed', () => {
      const error = new Error('');
      const api = { fetchCatalog: () => { throw error; } };
      return expectSaga(fetchCatalogWorker, api)
        .put(fetchCatalogRejected(error))
        .dispatch(fetchCatalog('de'))
        .run({ silenceTimeout: true })
        .catch(e =>
          expect(e).to.equal(error));
    });

    it('Should call the `fetchCatalog` method of the API', () => {
      const api = { fetchCatalog: () => catalog };
      return expectSaga(fetchCatalogWorker, api)
        .call([api, api.fetchCatalog], 'de')
        .dispatch(fetchCatalog('de'))
        .run({ silenceTimeout: true });
    });
  });

  describe('(Generator) i18nSaga', () => {
    it('Should be exported as a generator function', () => {
      expect(i18nSaga[Symbol.toStringTag]).to.equal('GeneratorFunction');
    });

    it('Should spawn all workers', () => {
      const api = {};
      return expectSaga(i18nSaga, api)
        .spawn(fetchCatalogWorker, api)
        .run({ silenceTimeout: true });
    });
  });
});
