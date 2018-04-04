/*global
    module,
    test,
    equal,
    deepEqual,
    OpenmixApplication,
    init,
    onRequest,
    console,
*/

(function() {
    'use strict';

    var default_settings = {
        generator_app_prefix: '2-01-2a40-0002',
        domain: 'maxgtm.net',
        reporter_app: '2-01-2a40-0006.cdx.maxgtm.net'
    };

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

            i.setup(test_stuff);

            sut = new OpenmixApplication(default_settings);

            // Test
            sut.doInit(config);

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
                test_stuff;

            sut = new OpenmixApplication(default_settings);

            test_stuff = {
                sut: sut,
                request: request,
                response: response
            };

            i.setup(test_stuff);

            // Test
            sut.handleRequest(request, response);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('first request', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request.hostname_prefix = '';
            sinon.clock.now = 1411169814447;
        },
        verify: function(i) {
            console.log(i);
            ok(!i.response.setReasonCode.called);
            equal(i.response.setTTL.args[0][0], 20, 'TTL');
            equal(i.response.respond.args[0][1], 'start-1411169814447.2-01-2a40-0002.cdx.maxgtm.net');
        }
    }));

    test('second request', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request.hostname_prefix = 'start-1411169814447';
            sinon.clock.now = 1411169814567;
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.setReasonCode.args[0][0], '120');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.respond.args[0][1], 'global.prod.fastly.net', 'Verifying CNAME');
        }
    }));

    test('second request; elapsed negative', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request.hostname_prefix = 'start-1411169814447';
            sinon.clock.now = 1411169814446;
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.setReasonCode.args[0][0], '0');
            equal(i.response.setTTL.args[0][0], 20, 'TTL');
            equal(i.response.respond.args[0][1], 'global.prod.fastly.net', 'CNAME');
        }
    }));

}());
