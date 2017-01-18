import { Shim } from '@dojo/shim/Map';

/**
 * An OrderedMap is like a regular map except that entries are iterated in key insertion order. The OrderedMap
 * also provides a set of array like extras.
 */
// We need to extend `Shim.Map` because the native ES Map does not allow extension in Chrome.
export default class OrderedMap<K, V> extends Shim.Map<K, V> {
}
