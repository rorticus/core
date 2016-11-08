import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import * as timing from '../../../src/async/timing';
import { isEventuallyRejected } from '../../support/util';
import 'dojo-shim/Promise';

registerSuite({
	name: 'async/timing',

	'delay()': {
		'delay returning a value after the given timeout': async function () {
			let start: number = await timing.delay<number>(251)(Date.now());
			const diff: number = Date.now() - start;
			assert.isAbove(diff, 249);
		},
		'delay executing a function that returns a value after the given timeout': async function () {
			const now = Date.now();
			const getNow = function() {
				return Date.now();
			};
			let finish = await timing.delay<number>(251)(getNow);

			const diff: number = finish - now;
			assert.isAbove(diff, 249);
		},
		'delay executing a function that returns another promise after the given timeout': async function () {
			const now = Date.now();
			const getNow = function() {
				return Promise.resolve( Date.now() );
			};
			let finish = await timing.delay<number>(251)(getNow);
			const diff: number = finish - now;
			assert.isAbove(diff, 249);
		},
		'delay should return undefined when the value is not passed in': async function () {
			let value = await timing.delay(251)();
			assert.isUndefined(value);
		},
		'delay can be reusable': async function () {
			const start = Date.now();
			const delay = timing.delay(251);

			await delay();
			assert.isAbove(Date.now() - start, 249);

			let fooValue = await delay('foo');
			assert.strictEqual(fooValue, 'foo');
			assert.isAbove(Date.now() - start, 249);

			let promiseValue = await delay(() => Promise.resolve('bar'));
			assert.strictEqual(promiseValue, 'bar');
			assert.isAbove(Date.now() - start, 249);
		}
	},

	'timeout()': {
		'called before the timeout; resolves the promise': function () {
			return Promise.resolve('unused').then((<any> timing).timeout(100, new Error('Error')));
		},

		'called after the timeout; rejects the promise': function () {
			return isEventuallyRejected(
				timing.delay(100)('unused')
					.then(timing.timeout(1, new Error('expected')))
			);
		}
	},

	'DelayedRejection': {
		'is eventually rejected': async function () {
			const start = Date.now();
			try {
				await new timing.DelayedRejection(101);
				assert(false, 'should have failed');
			} catch (reason) {
				assert.isUndefined(reason);
				assert.isAbove(Date.now(), start + 99);
			}
		},

		'is eventually rejected with error': async function () {
			const start = Date.now();
			const expectedError = new Error('boom!');

			try {
				await new timing.DelayedRejection(101, expectedError);
				assert(false, 'should have failed');
			} catch (reason) {
				assert.strictEqual(reason, expectedError);
				assert.isAbove(Date.now(), start + 99);
			}
		},

		'works with race': function () {
			return Promise.race([timing.delay(1)('success!'), new timing.DelayedRejection(100)]);
		}
	}
});
