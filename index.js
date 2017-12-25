'use strict';
const {inspect} = require('util');
const indentString = require('indent-string');
const cleanStack = require('clean-stack');

const cleanInternalStack = stack => stack.replace(/\s+at .*aggregate-error\/index.js:\d+:\d+\)?/g, '');

class AggregateError extends Error {
	constructor(errors) {
		// Even though strings are iterable, we don't allow them to prevent subtle user mistakes
		if (!errors[Symbol.iterator] || typeof errors === 'string') {
			throw new TypeError(`Expected input to be iterable, got ${typeof errors}`);
		}

		errors = Array.from(errors).map(err => err instanceof Error ? err : new Error(err));

		let message = errors.map(err => cleanInternalStack(cleanStack(err.stack))).join('\n');
		message = '\n' + indentString(message, 4);

		super(message);
		this.name = 'AggregateError';
		Object.defineProperty(this, '_errors', {value: errors});
	}

	* [Symbol.iterator]() {
		for (const error of this._errors) {
			yield error;
		}
	}

	[inspect.custom](depth, options) {
		return this.name + ' ' + inspect(this._errors, {...options, depth: options.depth === null ? null : options.depth - 1}).replace(/^\[/, '{\n').replace(/\]$/, '}');
	}
}

module.exports = AggregateError;
