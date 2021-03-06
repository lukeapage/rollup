require('babel/register');
var assert = require( 'assert' );

var Scope = require( '../src/Scope' );

describe( 'Scope', function () {
	it( 'can define and bind names', function () {
		const scope = new Scope();

		// If I define 'a'...
		scope.define( 'a' );

		// ... and bind 'b' to a reference to 'a'...
		scope.bind( 'b', scope.reference( 'a' ) );

		// ... lookups for 'a' and 'b' should both
		// resolve to the same identifier.
		assert.equal( scope.lookup( 'b' ), scope.lookup( 'a' ) );
	});

	describe( 'parent:', function () {
		var parent = new Scope(),
			child = new Scope( parent );

		it( 'allows children access to its names', function () {
			parent.define( 'a' );

			assert.equal( child.lookup( 'a' ), parent.lookup( 'a' ) );
		});

		it( 'names in the child scope shadows the parent', function () {
			child.define( 'a' );

			assert.notEqual( child.lookup( 'a' ), parent.lookup( 'a' ) );

			child.define( 'b' );

			assert.equal( parent.lookup( 'b' ), undefined );
		});
	});

	describe( 'virtual scope:', function () {
		var real, a, b;

		beforeEach(function () {
			real = new Scope();
			a = real.virtual();
			b = real.virtual();
		});

		it( 'is created within another scope', function () {
			// The actual ids are the same.
			assert.equal( real.ids, a.ids );
			assert.equal( real.ids, b.ids );
		});

		it( 'lookups different identifiers', function () {
			// If I define 'a' in both scopes...
			a.define( 'a' );
			b.define( 'a' );

			// ... the name 'a' should lookup different identifiers.
			assert.notEqual( a.lookup( 'a' ), b.lookup( 'b' ) );
		});

		it( 'can deconflict names', function () {
			a.define( 'a' );
			b.define( 'a' );

			// Deconflicting the actual scope should make all identifiers unique.
			real.deconflict();

			assert.deepEqual( real.usedNames(), [ '_a', 'a' ] );
		});

		it( 'deconflicts with a custom function, if provided', function () {
			for (var i = 0; i < 26; i++) {
				// Create 26 scopes, all of which define 'a'.
				real.virtual().define( 'a' );
			}

			// Custom deconfliction function which ignores the current name.
			var num = 10;
			real.deconflict( function () {
				return (num++).toString(36);
			});

			assert.deepEqual( real.usedNames(), 'abcdefghijklmnopqrstuvwxyz'.split('') );

			// Deconflicting twice has no additional effect.
			real.deconflict();
			assert.deepEqual( real.usedNames(), 'abcdefghijklmnopqrstuvwxyz'.split('') );
		});
	});

	it( 'cannot reference undefined names', function () {
		var real = new Scope();

		var external = real.virtual(),
			locals = real.virtual(),
			exports = real.virtual();

		external.define( 'Component' );

		locals.bind( 'Comp', external.reference( 'Component' ) );

		assert.throws( function () {
			exports.bind( 'default', locals.reference( 'Foo' ) );
		}, 'Cannot reference undefined identifier "Foo"' );

		locals.define( 'Foo' );
		exports.bind( 'default', locals.reference( 'Foo' ) );
	});
});
