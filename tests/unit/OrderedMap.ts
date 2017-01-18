import * as assert from 'intern/chai!assert';
import * as registerSuite from 'intern!object';
import { forOf } from '@dojo/shim/iterator';
import OrderedMap from '../../src/OrderedMap';

registerSuite({
	name: 'OrderedMap',

	'preserves key order'() {
		const map = new OrderedMap<string, number>();

		map.set('a', 1);
		map.set('c', 3);
		map.set('b', 2);

		let keys: string[] = [];

		forOf(map.keys(), (key) => {
			keys.push(key);
		});

		assert.deepEqual(keys, [ 'a', 'c', 'b' ]);
	},

	'preserves value order'() {
		const map = new OrderedMap<string, number>();

		map.set('a', 1);
		map.set('c', 3);
		map.set('b', 2);

		let values: number[] = [];

		forOf(map.values(), (value) => {
			values.push(value);
		});

		assert.deepEqual(values, [ 1, 3, 2 ]);
	},

	'preserves entry order'() {
		const map = new OrderedMap<string, number>();

		map.set('a', 1);
		map.set('c', 3);
		map.set('b', 2);

		let entries: [ string, number ][] = [];

		forOf(map.entries(), ([ entry, value ]) => {
			entries.push([ entry, value ]);
		});

		assert.deepEqual(entries, [ [ 'a', 1 ], [ 'c', 3 ], [ 'b', 2 ] ]);
	}
});
