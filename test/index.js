const assert = require('chai').assert;
const messengerBot = require('../lib');

describe('Create bot', function() {
    describe('with wrong token validation', function () {
        it('should not be authorized', function () {
            assert.equal(1, 1);
        });
    });
});
