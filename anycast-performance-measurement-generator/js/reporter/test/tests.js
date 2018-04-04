/*global
    module,
    test,
    expect,
    equal,
    deepEqual,
    OpenmixApplication,
    init,
    onRequest,
    console,
*/

(function() {
    'use strict';

    module('do_init');

    function test_do_init(i) {
        return function() {

            var sut,
                config = {
                    requireProvider: this.stub()
                },
                test_stuff = {
                    config: config
                };

            sut = new OpenmixApplication();

            i.setup(test_stuff);

            // Test
            sut.do_init(config);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('change me', test_do_init({
        setup: function(i) {
            console.log(i);
        },
        verify: function(i) {
            console.log(i);
            equal(i.config.requireProvider.args[0][0], 'anycast');
        }
    }));

    module('handle_request');

    function test_handle_request(i) {
        return function() {
            var sut,
                request = {
                    getProbe: this.stub()
                },
                response = {
                    respond: this.stub(),
                    setTTL: this.stub(),
                    setReasonCode: this.stub()
                },
                test_stuff = {
                    request: request,
                    response: response
                };

            i.setup(test_stuff);

            sut = new OpenmixApplication();

            // Test
            sut.handle_request(request, response);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('change me', test_handle_request({
        setup: function(i) {
            console.log(i);
        },
        verify: function(i) {
            console.log(i);
            expect(0);
        }
    }));

}());
