
(function() {
    'use strict';

    var default_settings = {
        providers: {
            'equinix': {
                cname: 'origin.20minutes.fr',
                padding: 10
            },
            'edgecast': {
                cname: 'wac.6497.edgecastcdn.net',
                padding: 0
            },
            'level3': {
                cname:'cache.20minutes.fr.c.footprint.net',
                padding: 0
            }
        },


        // The TTL to be set when the application chooses a geo provider.
        default_ttl: 20,
        availability_threshold: 90
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
            equal(i.config.requireProvider.args[2][0], 'equinix');
            equal(i.config.requireProvider.args[1][0], 'edgecast');
            equal(i.config.requireProvider.args[0][0], 'level3');
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

    test('test 1 -best_performing_provider', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'equinix': { avail: 100 },
                    'edgecast': { avail: 100 },
                    'level3': { avail: 85 }
            });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'equinix': { http_rtt: 60 },
                    'edgecast': { http_rtt: 85 },
                    'level3': { http_rtt: 90 }
            });
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


    test('test 3 -all_providers_eliminated', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'equinix': { avail: 70 },
                    'edgecast': { avail: 50 },
                    'level3': { avail: 75 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({
                    'equinix': { http_rtt: 60 },
                    'edgecast': { http_rtt: 85 },
                    'level3': { http_rtt: 90 }
                });
        },
        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'level3', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cache.20minutes.fr.c.footprint.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'C', 'Verifying reason code');
        }
    }));

    test('test 4 -data_problem', test_handle_request({
        setup: function(i) {
            console.log(i);
            i.request
                .getProbe
                .onCall(0)
                .returns({
                    'equinix': { avail: 100 },
                    'edgecast': { avail: 100 },
                    'level3': { avail: 85 }
                });
            i.request
                .getProbe
                .onCall(1)
                .returns({});
            Math.random.returns(0.999);
        },

        verify: function(i) {
            console.log(i);
            equal(i.response.respond.callCount, 1, 'Verifying respond call count');
            equal(i.response.setTTL.callCount, 1, 'Verifying setTTL call count');
            equal(i.response.setReasonCode.callCount, 1, 'Verifying setReasonCode call count');

            equal(i.response.respond.args[0][0], 'level3', 'Verifying selected alias');
            equal(i.response.respond.args[0][1], 'cache.20minutes.fr.c.footprint.net', 'Verifying CNAME');
            equal(i.response.setTTL.args[0][0], 20, 'Verifying TTL');
            equal(i.response.setReasonCode.args[0][0], 'B', 'Verifying reason code');
        }
    }));

}());
