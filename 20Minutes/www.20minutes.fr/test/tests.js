
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'akamai': {
                cname: 'www.20minutes.fr.edgesuite.net',
                weight: 0
            },
            'fastly': {
                cname: 'www.20minutes.fr.a.prod.fastly.net',
                weight: 0
            },
            'equinix': {
                cname: 'origin.20minutes.fr',
                weight: 100
            }
        },

        // The TTL to be set when the application chooses a geo provider.
        default_ttl: 20
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
            sut = new OpenmixApplication(i.settings || default_settings);
            // Test
            sut.do_init(config);
            // Assert
            i.verify(test_stuff);
        };
    }

    test('default', test_do_init({
        setup: function() {
            return;
        },
        verify: function(i) {
            equal(i.config.requireProvider.callCount, 3);
            equal(i.config.requireProvider.args[2][0], 'akamai');
            equal(i.config.requireProvider.args[1][0], 'fastly');
            equal(i.config.requireProvider.args[0][0], 'equinix');
        }
    }));

    module('handle_request');

    function test_handle_request(i) {
        return function() {
            var sut,
                config = {
                    requireProvider: this.stub()
                },
                request = {
                    getProbe: this.stub(),
                    getData: this.stub()
                },
                response = {
                    respond: this.stub(),
                    setTTL: this.stub(),
                    setReasonCode: this.stub()
                },
                test_stuff;

            sut = new OpenmixApplication(i.settings || default_settings);
            sut.do_init(config);

            test_stuff = {
                request: request,
                response: response,
                sut: sut
            };

            this.stub(Math, 'random');

            i.setup(test_stuff);

            // Test
            sut.handle_request(request, response);

            // Assert
            i.verify(test_stuff);
        };
    }

    test('test 1 -successfully_routed', test_handle_request({
        settings: {
            providers: {
                'akamai': {
                    cname: 'www.20minutes.fr.edgesuite.net',
                    weight: 0
                },
                'fastly': {
                    cname: 'www.20minutes.fr.a.prod.fastly.net',
                    weight: 0
                },
                'equinix': {
                    cname: 'origin.20minutes.fr',
                    weight: 100
                }
            },
            // The TTL to be set when the application chooses a geo provider.
            default_ttl: 20
        },
        setup: function(i) {
            console.log(i);
            Math.random.returns(0.5);
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'equinix', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'origin.20minutes.fr', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'A', 'Verifying reason code');
        }
    }));

    test('test 2 -insufficient_data', test_handle_request({
        settings: {
            providers: {
                'akamai': {
                    cname: 'www.20minutes.fr.edgesuite.net',
                    weight: 0
                },
                'fastly': {
                    cname: 'www.20minutes.fr.a.prod.fastly.net',
                    weight: 0
                },
                'equinix': {
                    cname: 'origin.20minutes.fr',
                    weight: 0
                }
            },
            // The TTL to be set when the application chooses a geo provider.
            default_ttl: 20
        },
        setup: function(i) {
            console.log(i);
            Math.random.returns(0.1);
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'akamai', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'www.20minutes.fr.edgesuite.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

}());
